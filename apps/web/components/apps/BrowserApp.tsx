"use client";

import { useState, type FormEvent } from "react";
import { readTextFile } from "@time-machine/desktop-engine";
import type { AppProps } from "./types";

/**
 * Time Browser — shell only for now. The Browser Engine (Phase 4) will plug
 * `resolveHistoricalUrl` into `navigate`; the chrome (address bar, history,
 * status bar) is already in place so Phase 4 only swaps the content pane.
 */
export function BrowserApp({ era, fs }: AppProps) {
  const [history, setHistory] = useState<string[]>(["about:home"]);
  const [cursor, setCursor] = useState(0);
  const [input, setInput] = useState("about:home");
  const url = history[cursor] ?? "about:home";

  const favorites =
    readTextFile(fs, "/Mes Documents/favoris.txt")
      ?.split("\n")
      .filter((l) => l.startsWith("http")) ?? [];

  function navigate(next: string) {
    const target = next.trim();
    if (!target) return;
    const trimmed = history.slice(0, cursor + 1);
    setHistory([...trimmed, target]);
    setCursor(trimmed.length);
    setInput(target);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    navigate(input);
  }

  function go(delta: number) {
    const next = cursor + delta;
    if (next < 0 || next >= history.length) return;
    setCursor(next);
    setInput(history[next] ?? "");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="tm-toolbar flex items-center gap-1 p-1">
        <button className="tm-btn" onClick={() => go(-1)} disabled={cursor === 0} type="button">
          ◀ Précédent
        </button>
        <button
          className="tm-btn"
          onClick={() => go(1)}
          disabled={cursor >= history.length - 1}
          type="button"
        >
          Suivant ▶
        </button>
        <button className="tm-btn" onClick={() => navigate("about:home")} type="button">
          Accueil
        </button>
      </div>
      <form onSubmit={onSubmit} className="tm-toolbar flex items-center gap-2 px-2 py-1">
        <label className="text-xs" htmlFor="tm-address">
          Adresse
        </label>
        <input
          id="tm-address"
          className="tm-input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
        <button className="tm-btn" type="submit">
          OK
        </button>
      </form>
      <div className="tm-app-body flex-1 overflow-auto p-4 text-sm" data-testid="browser-page">
        {url === "about:home" ? (
          <>
            <h2 className="text-lg font-bold">Time Browser — {era.label}</h2>
            <p className="mt-2">
              Vous êtes connecté au réseau de {era.dateStart.slice(0, 4)}
              {era.network.web ? " via un modem 56k." : ", mais le Web n'y est pas disponible."}
            </p>
            <p className="mt-2 text-[var(--tm-text-muted)]">
              Le Time Web (sites historiques et recherche datée) est branché en phases 4 à 6. En
              attendant, la barre d&apos;adresse et l&apos;historique fonctionnent.
            </p>
            {favorites.length > 0 && (
              <>
                <h3 className="mt-4 font-bold">Favoris</h3>
                <ul className="mt-1 list-disc pl-5">
                  {favorites.map((f) => (
                    <li key={f}>
                      <button
                        type="button"
                        className="underline"
                        style={{ color: "var(--tm-selection)" }}
                        onClick={() => navigate(f)}
                      >
                        {f}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold">Impossible d&apos;afficher la page</h2>
            <p className="mt-2">
              <span className="font-mono">{url}</span> n&apos;est pas encore reconstitué dans le
              Time Web. Cette adresse sera résolue par le moteur de navigation historique (phase 4).
            </p>
          </>
        )}
      </div>
      <div className="tm-statusbar px-2 py-0.5 text-xs">
        {url === "about:home" ? "Terminé" : `Connexion à ${url}...`}
      </div>
    </div>
  );
}
