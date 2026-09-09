"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { eraNow } from "@time-machine/desktop-engine";
import {
  createPlayerState,
  formatTime,
  listLibrary,
  mediaCatalog,
  pause,
  play,
  seek,
  tick,
  type PlayerState,
} from "@time-machine/media-engine";
import type { AppProps } from "./types";
import "./media-player.css";

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function frDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatViews(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/**
 * A small 2005-style video site. Nothing here plays real footage: each
 * clip renders as an original animated placeholder
 * (`components/apps/media/Visual.tsx`-equivalent inline below), never a
 * reproduction of the actual historical recording. The library is gated by
 * the machine's simulated date (@time-machine/media-engine), so a clip
 * uploaded in the future stays visibly locked rather than simply missing.
 */
export function MediaPlayerApp({ clock }: AppProps) {
  const catalog = mediaCatalog;
  const selectedDate = useMemo(() => isoDate(eraNow(clock)), [clock]);
  const library = useMemo(() => listLibrary(catalog, selectedDate), [catalog, selectedDate]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  const selected = selectedId ? catalog.getVideo(selectedId) : undefined;
  const entry = selectedId ? library.find((e) => e.clip.id === selectedId) : undefined;

  function openClip(id: string) {
    const clip = catalog.getVideo(id);
    if (!clip) return;
    setSelectedId(id);
    setPlayer(createPlayerState(clip));
  }

  useEffect(() => {
    if (!player || player.status !== "playing") return;
    lastRef.current = performance.now();
    const step = (now: number) => {
      const delta = now - lastRef.current;
      lastRef.current = now;
      setPlayer((p) => (p ? tick(p, delta) : p));
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-armed by status change only
  }, [player?.status]);

  if (selected && player && entry?.unlocked) {
    const progress = player.durationMs > 0 ? player.positionMs / player.durationMs : 0;
    return (
      <div className="mp-root">
        <div className="mp-toolbar">
          <button
            type="button"
            className="mp-back"
            data-testid="media-back"
            onClick={() => setSelectedId(null)}
          >
            ← Bibliothèque
          </button>
        </div>
        <div className="mp-screen" data-visual={selected.visual} data-testid="media-screen">
          <div className="mp-visual" aria-hidden />
          <div className="mp-overlay">{selected.title}</div>
        </div>
        <div className="mp-controls">
          <button
            type="button"
            className="mp-play"
            data-testid="media-playpause"
            onClick={() =>
              setPlayer((p) => (p ? (p.status === "playing" ? pause(p) : play(p)) : p))
            }
          >
            {player.status === "playing" ? "⏸" : "▶"}
          </button>
          <input
            type="range"
            min={0}
            max={player.durationMs}
            value={player.positionMs}
            onChange={(e) => setPlayer((p) => (p ? seek(p, Number(e.target.value)) : p))}
            className="mp-scrubber"
            data-testid="media-scrubber"
            aria-label="Position de lecture"
          />
          <span className="mp-time" data-testid="media-time">
            {formatTime(player.positionMs)} / {formatTime(player.durationMs)}
          </span>
        </div>
        <div className="mp-progress-track" aria-hidden>
          <div className="mp-progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mp-meta">
          <h2 className="mp-title">{selected.title}</h2>
          <p className="mp-sub">
            {formatViews(entry.views)} vues — mis en ligne par {selected.uploader} le{" "}
            {frDate(selected.uploadDate)}
          </p>
          <p className="mp-description">{selected.description}</p>
        </div>
        <div className="mp-comments" data-testid="media-comments">
          <h3 className="mp-comments-title">Commentaires</h3>
          {catalog.commentsOf(selected.id).map((c) => (
            <div key={c.id} className="mp-comment">
              <span className="mp-comment-author">{c.author}</span>
              <span className="mp-comment-date"> · {c.date}</span>
              <p className="mp-comment-text">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mp-root">
      <div className="mp-library-header">Vidéos ({frDate(selectedDate)})</div>
      <div className="mp-library" data-testid="media-library">
        {library.map(({ clip, unlocked, views }) => (
          <button
            key={clip.id}
            type="button"
            className="mp-card"
            data-testid={`video-${clip.id}`}
            data-locked={!unlocked}
            disabled={!unlocked}
            onClick={() => openClip(clip.id)}
          >
            <div className={`mp-thumb mp-thumb-${clip.visual}`}>
              {!unlocked && (
                <span className="mp-lock" data-testid={`video-locked-${clip.id}`}>
                  🔒
                </span>
              )}
            </div>
            <div className="mp-card-title">{clip.title}</div>
            <div className="mp-card-meta">
              {unlocked
                ? `${formatViews(views)} vues · ${clip.uploader}`
                : `Disponible le ${frDate(clip.uploadDate)}`}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
