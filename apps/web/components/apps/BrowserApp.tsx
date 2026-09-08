"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  canGoBack,
  canGoForward,
  createBrowserHistory,
  currentUrl,
  goBack,
  goForward,
  isAboutUrl,
  navigateTo,
  normalizeUrl,
  resolveHistoricalUrl,
  resolveLink,
  timeWebCatalog,
} from "@time-machine/browser-engine";
import { eraNow, readTextFile } from "@time-machine/desktop-engine";
import { ResolutionView } from "./browser/ResolutionView";
import type { AppProps } from "./types";
import "./browser/reconstruction.css";

const HOME = "about:home";

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Time Browser — the internal, simulated browser. Every address goes
 * through the Browser Engine's `resolveHistoricalUrl` at the machine's
 * simulated date; nothing is ever fetched from the real network.
 */
export function BrowserApp({ era, fs, clock, payload }: AppProps) {
  const initialUrl = typeof payload.url === "string" ? payload.url : HOME;
  const [history, setHistory] = useState(() => createBrowserHistory(initialUrl));
  const [input, setInput] = useState(initialUrl);
  const url = currentUrl(history);
  // The date is sampled at navigation time; a long session drifts naturally with the era clock.
  const [selectedDate, setSelectedDate] = useState(() => isoDate(eraNow(clock)));

  const favorites = useMemo(
    () =>
      readTextFile(fs, "/Mes Documents/favoris.txt")
        ?.split("\n")
        .filter((l) => l.startsWith("http")) ?? [],
    [fs],
  );

  const resolution = useMemo(
    () =>
      isAboutUrl(url) ? undefined : resolveHistoricalUrl(timeWebCatalog, { url, selectedDate }),
    [url, selectedDate],
  );

  /** Go to an absolute address (address bar, favourites, home). */
  function navigate(target: string) {
    const trimmed = target.trim();
    if (!trimmed) return;
    const canonical = normalizeUrl(trimmed)?.href ?? trimmed;
    setSelectedDate(isoDate(eraNow(clock)));
    setHistory((h) => navigateTo(h, canonical));
    setInput(canonical);
  }

  /** Follow a link found inside a page: paths are relative to the current page. */
  function follow(href: string) {
    const base = normalizeUrl(url);
    navigate(base && base.scheme !== "about" ? resolveLink(href, base) : href);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    navigate(input);
  }

  function back() {
    setHistory((h) => {
      const next = goBack(h);
      setInput(currentUrl(next));
      return next;
    });
  }

  function forward() {
    setHistory((h) => {
      const next = goForward(h);
      setInput(currentUrl(next));
      return next;
    });
  }

  const status = (() => {
    if (!resolution) return "Terminé";
    switch (resolution.type) {
      case "reconstruction":
        return `Reconstitution — ${resolution.url.hostname}`;
      case "archive":
        return "Archive documentaire référencée";
      case "snapshot":
        return "Capture historique";
      case "document":
        return "Document historique";
      case "website-card":
        return "Fiche documentaire";
      case "not-found":
        return `404 temporelle (${resolution.reason})`;
    }
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="tm-toolbar flex items-center gap-1 p-1">
        <button
          className="tm-btn"
          onClick={back}
          disabled={!canGoBack(history)}
          type="button"
          data-testid="browser-back"
        >
          ◀ Précédent
        </button>
        <button
          className="tm-btn"
          onClick={forward}
          disabled={!canGoForward(history)}
          type="button"
          data-testid="browser-forward"
        >
          Suivant ▶
        </button>
        <button
          className="tm-btn"
          onClick={() => navigate(HOME)}
          type="button"
          data-testid="browser-home-button"
        >
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
          data-testid="browser-address"
        />
        <button className="tm-btn" type="submit" data-testid="browser-go">
          OK
        </button>
      </form>
      <div className="tm-app-body flex-1 overflow-auto" data-testid="browser-page">
        {resolution ? (
          <ResolutionView
            resolution={resolution}
            catalog={timeWebCatalog}
            era={era}
            selectedDate={selectedDate}
            onNavigate={follow}
          />
        ) : (
          <div className="tw-page" data-testid="browser-home">
            <h1 className="tw-heading">Time Browser</h1>
            <p className="tw-paragraph">
              {era.label}. Vous êtes connecté au réseau de {era.dateStart.slice(0, 4)}
              {era.network.web ? " via un modem 56k." : ", mais le Web n'y est pas disponible."}
            </p>
            <p className="tw-notice">
              Le Time Browser n&apos;affiche que ce qui existait à la date de la machine :
              reconstitutions locales, captures et documents historiques. Rien n&apos;est chargé
              depuis l&apos;Internet réel.
            </p>
            {favorites.length > 0 && (
              <>
                <h3 className="tw-heading">Favoris</h3>
                <ul className="tw-links-list">
                  {favorites.map((f) => (
                    <li key={f}>
                      <a
                        href={f}
                        className="tw-link"
                        data-testid={`favorite-${normalizeUrl(f)?.domain ?? f}`}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(f);
                        }}
                      >
                        {f}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="tw-notice">
              Sites documentés : {timeWebCatalog.websites.map((w) => w.domain).join(", ")}.
            </p>
          </div>
        )}
      </div>
      <div className="tm-statusbar px-2 py-0.5 text-xs" data-testid="browser-status">
        {status}
      </div>
    </div>
  );
}
