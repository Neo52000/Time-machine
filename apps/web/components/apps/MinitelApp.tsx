"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { eraNow } from "@time-machine/desktop-engine";
import {
  DEFAULT_SESSION_OPTIONS,
  createSession,
  minitelCatalog,
  pressKey,
  renderScreen,
  resolvePending,
  typeChar,
  type FunctionKey,
  type SessionState,
} from "@time-machine/minitel-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import type { AppProps } from "./types";
import "./minitel.css";

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const KEYS: { key: FunctionKey; label: string; hint: string }[] = [
  { key: "SOMMAIRE", label: "Sommaire", hint: "Début" },
  { key: "ANNULATION", label: "Annulation", hint: "Échap" },
  { key: "RETOUR", label: "Retour", hint: "Page ↑" },
  { key: "REPETITION", label: "Répétition", hint: "F2" },
  { key: "GUIDE", label: "Guide", hint: "F1" },
  { key: "CORRECTION", label: "Correction", hint: "⌫" },
  { key: "SUITE", label: "Suite", hint: "Page ↓" },
  { key: "ENVOI", label: "Envoi", hint: "Entrée" },
  { key: "CONNEXION_FIN", label: "Connexion / Fin", hint: "Fin" },
];

const KEYBOARD: Record<string, FunctionKey> = {
  Enter: "ENVOI",
  Escape: "ANNULATION",
  Backspace: "CORRECTION",
  Home: "SOMMAIRE",
  PageUp: "RETOUR",
  PageDown: "SUITE",
  F1: "GUIDE",
  F2: "REPETITION",
  End: "CONNEXION_FIN",
};

/** What a screen reader hears about the session, since the videotex grid itself is noise. */
function describe(session: SessionState): string {
  switch (session.phase) {
    case "idle":
      return session.message ?? "Minitel prêt. Composez un code kiosque puis Connexion.";
    case "dialing":
      return `Connexion au ${session.kioskCode ?? ""} en cours`;
    case "loading":
      return "Chargement de la page";
    case "kiosk":
      return `Connecté au kiosque ${session.kioskCode ?? ""}.${session.message ? ` ${session.message}` : ""}`;
    case "service":
      return `Service ${session.location?.serviceId ?? ""}.${session.message ? ` ${session.message}` : ""}`;
  }
}

/**
 * Minitel 1B — the whole machine. The engine owns the session; this
 * component only feeds keys, honours the latency it asks for, and paints
 * the 40×25 screen. Time spent connected is measured here (real seconds).
 */
export function MinitelApp({ clock }: AppProps) {
  const [session, setSession] = useState<SessionState>(() => createSession(isoDate(eraNow(clock))));
  const connectedSince = useRef<number | null>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const catalog = minitelCatalog;
  const audio = useAudio();
  const { track } = useAnalytics();

  // Honour the engine's requested latency, then complete the transition.
  useEffect(() => {
    if (!session.pending) return;
    const id = setTimeout(() => setSession((s) => resolvePending(s)), session.pending.ms);
    return () => clearTimeout(id);
  }, [session]);

  // Track connection time for the hang-up summary.
  useEffect(() => {
    if (session.phase === "kiosk" || session.phase === "service") {
      connectedSince.current ??= Date.now();
    } else if (session.phase === "idle") {
      connectedSince.current = null;
    }
  }, [session.phase]);

  // The phase machine drives the sound: dial tone while dialing, carrier on
  // connection, a drop when hanging up. The engine stays timer- and audio-free.
  const previousPhase = useRef(session.phase);
  useEffect(() => {
    const previous = previousPhase.current;
    previousPhase.current = session.phase;
    if (session.phase === previous) return;
    if (session.phase === "dialing") {
      audio.play("dial");
    } else if (
      previous === "dialing" &&
      (session.phase === "kiosk" || session.phase === "service")
    ) {
      audio.play("connect");
      track("minitel.connected", {
        kiosk: session.kioskCode ?? "",
        service: session.location?.serviceId ?? "",
      });
    } else if (session.phase === "idle") {
      audio.play("disconnect");
    }
  }, [session.phase, session.kioskCode, session.location?.serviceId, audio, track]);

  // A refused input shows a message: sound it, except the hang-up summary.
  const previousMessage = useRef(session.message);
  useEffect(() => {
    const previous = previousMessage.current;
    previousMessage.current = session.message;
    if (session.message && session.message !== previous && session.phase !== "idle") {
      audio.play("error");
    }
  }, [session.message, session.phase, audio]);

  const press = useCallback(
    (key: FunctionKey) => {
      setSession((s) => {
        const withDuration =
          key === "CONNEXION_FIN" && connectedSince.current !== null
            ? { ...s, connectedAt: Date.now() - connectedSince.current }
            : s;
        return pressKey(withDuration, key, catalog, DEFAULT_SESSION_OPTIONS);
      });
      screenRef.current?.focus();
    },
    [catalog],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const fn = KEYBOARD[e.key];
      if (fn) {
        e.preventDefault();
        press(fn);
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setSession((s) => typeChar(s, e.key, catalog));
      }
    },
    [catalog, press],
  );

  useEffect(() => {
    screenRef.current?.focus();
  }, []);

  const screen = useMemo(() => renderScreen(session, catalog), [session, catalog]);

  return (
    <div className="mt-root" data-testid="minitel" data-phase={session.phase}>
      <div
        ref={screenRef}
        className="mt-screen"
        tabIndex={0}
        role="application"
        aria-label="Écran Minitel"
        aria-describedby="mt-status"
        onKeyDown={onKeyDown}
        onClick={() => screenRef.current?.focus()}
        data-testid="minitel-screen"
      >
        {screen.map((row, i) => (
          <div
            key={i}
            className={`mt-row mt-${row.color}${row.inverse ? " mt-inverse" : ""}`}
            data-row={i}
          >
            {row.text}
          </div>
        ))}
      </div>
      <div id="mt-status" className="sr-only" aria-live="polite" data-testid="minitel-status">
        {describe(session)}
      </div>
      <div className="mt-keypad" role="toolbar" aria-label="Touches de fonction">
        {KEYS.map((k) => (
          <button
            key={k.key}
            type="button"
            className="mt-key"
            data-testid={`mt-key-${k.key}`}
            title={`${k.label} (${k.hint})`}
            aria-label={`${k.label} — touche ${k.hint}`}
            onClick={() => press(k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
