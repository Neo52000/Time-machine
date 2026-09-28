"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { BbsItem } from "@time-machine/content-schema";
import {
  OFFLINE,
  bbsCatalog,
  connected,
  dial,
  render,
  submit,
  type BbsEffect,
  type BbsSession,
} from "@time-machine/bbs-engine";
import { formatDuration, transferTimeMs } from "@time-machine/computer-engine";
import { eraNow } from "@time-machine/desktop-engine";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import { useNetworkConnection } from "@/lib/useNetworkConnection";
import type { AppProps } from "./types";
import "./bbs.css";

/** Downloads play faster than real time, and say so: 34 s of 1992 become 3.4 s. */
const DOWNLOAD_SPEEDUP = 10;

function isoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

interface Download {
  item: BbsItem;
  realMs: number;
  startedAt: number;
  progress: number;
}

/**
 * Terminal BBS: calls a (fictional) bulletin board over the machine's modem.
 * The BBS engine is pure; this component owns the modem (the shared
 * `useNetworkConnection` line), the keyboard and the download timer.
 */
export function BbsApp({ era, clock }: AppProps) {
  const [session, setSession] = useState<BbsSession>(OFFLINE);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [download, setDownload] = useState<Download | null>(null);
  const { connection, connect, hangUp, link } = useNetworkConnection(era);
  const { emit, createFile } = useNarrative();
  const inputRef = useRef<HTMLInputElement>(null);
  const boards = useMemo(() => bbsCatalog.boardsAt(isoDate(eraNow(clock))), [clock]);

  // The handshake finished: the board answers.
  useEffect(() => {
    if (session.phase === "dialing" && connection.phase === "online") {
      setSession((s) => connected(s));
    }
  }, [session.phase, connection.phase]);

  // The line dropped (tray hang-up) while a board was on the line.
  useEffect(() => {
    if (connection.phase === "offline" && session.phase !== "offline") {
      setSession({ ...OFFLINE, message: "NO CARRIER — la communication est coupée." });
      setDownload(null);
    }
  }, [connection.phase, session.phase]);

  useEffect(() => {
    if (session.phase === "login" || session.phase === "menu") inputRef.current?.focus();
  }, [session.phase]);

  // Download progress, accelerated; the file lands on the disk when it completes.
  useEffect(() => {
    if (!download || download.progress >= 1) return;
    const id = window.setInterval(() => {
      setDownload((d) => {
        if (!d) return d;
        const progress = Math.min(1, ((Date.now() - d.startedAt) * DOWNLOAD_SPEEDUP) / d.realMs);
        return { ...d, progress };
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [download]);

  const finished = download?.progress === 1 ? download.item : null;
  useEffect(() => {
    if (!finished?.filename) return;
    createFile({
      path: `/BBS/DOWNLOAD/${finished.filename}`,
      content: [finished.title, "", ...finished.body].join("\n"),
    });
    emit("service.opened", { kiosk: "bbs-download", service: finished.filename });
  }, [finished, createFile, emit]);

  function perform(effects: BbsEffect[]) {
    for (const effect of effects) {
      switch (effect.type) {
        case "hangup":
          hangUp();
          break;
        case "logged-in":
          emit("service.opened", { kiosk: "bbs", service: effect.board.id });
          break;
        case "opened-area":
          emit("service.opened", { kiosk: "bbs-area", service: effect.area.kind });
          break;
        case "download":
          if (link && effect.item.sizeKb) {
            setDownload({
              item: effect.item,
              realMs: transferTimeMs(effect.item.sizeKb * 1024, link),
              startedAt: Date.now(),
              progress: 0,
            });
          }
          break;
      }
    }
  }

  function call(boardId: string) {
    if (connection.phase === "online") {
      // One phone line: already online means the line is taken.
      setBusy(true);
      return;
    }
    setBusy(false);
    setDownload(null);
    setSession(dial(boardId));
    connect();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (download && download.progress < 1) return;
    const result = submit(session, bbsCatalog, input);
    setSession(result.state);
    perform(result.effects);
    setInput("");
  }

  const transferLabel = (item: BbsItem) =>
    link && item.sizeKb
      ? `(${formatDuration(transferTimeMs(item.sizeKb * 1024, link))} à ${link.label.replace("modem ", "")})`
      : "";
  const lines = render(session, bbsCatalog, {
    connectBps: link?.downstreamBps,
    transferLabel,
  });
  const online = session.phase !== "offline" && session.phase !== "dialing";

  return (
    <div className="bbs-root">
      <aside className="bbs-book" aria-label="Annuaire des BBS">
        <div className="bbs-book-title">Annuaire</div>
        {boards.map((board) => (
          <div key={board.id} className="bbs-entry">
            <div className="bbs-entry-name">{board.name}</div>
            <div className="bbs-entry-phone">{board.phone}</div>
            <button
              type="button"
              className="tm-btn"
              disabled={session.phase !== "offline"}
              onClick={() => call(board.id)}
              data-testid={`bbs-dial-${board.id}`}
            >
              Appeler
            </button>
          </div>
        ))}
        <p className="bbs-note">BBS fictifs, créés pour la démonstration.</p>
      </aside>
      <div className="bbs-term">
        <div
          className="bbs-screen"
          data-testid="bbs-screen"
          data-phase={session.phase}
          role="log"
          aria-live="polite"
        >
          {lines.map((line, i) => (
            <div key={i} className={`bbs-line bbs-${line.color}`}>
              {line.text || " "}
            </div>
          ))}
          {busy && (
            <div className="bbs-line bbs-red" data-testid="bbs-busy">
              Ligne occupée : le modem est déjà en communication. Raccrochez d&apos;abord (icône
              modem de la barre des tâches).
            </div>
          )}
          {download && (
            <div className="bbs-download" data-testid="bbs-download">
              <div className="bbs-line bbs-green">
                {download.progress < 1
                  ? `Réception de ${download.item.filename}… ${Math.round(download.progress * 100)} %`
                  : `${download.item.filename} reçu — enregistré dans C:\\BBS\\DOWNLOAD`}
              </div>
              <div className="bbs-bar" aria-hidden>
                <div style={{ width: `${download.progress * 100}%` }} />
              </div>
              <div className="bbs-line bbs-gray">
                Durée réelle à l&apos;époque : {formatDuration(download.realMs)} (affichage accéléré
                ×{DOWNLOAD_SPEEDUP})
              </div>
            </div>
          )}
        </div>
        <form className="bbs-prompt" onSubmit={onSubmit}>
          <span aria-hidden>&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!online}
            spellCheck={false}
            autoComplete="off"
            aria-label="Commande BBS"
            data-testid="bbs-input"
          />
        </form>
      </div>
    </div>
  );
}
