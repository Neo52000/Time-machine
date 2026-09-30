"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import {
  estimatePayloadBytes,
  formatDuration,
  machineCatalog,
  transferTimeMs,
} from "@time-machine/computer-engine";
import { eraNow, readTextFile } from "@time-machine/desktop-engine";
import { getSearchProvider, search, timeSearchIndex } from "@time-machine/search-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import { useNetworkConnection } from "@/lib/useNetworkConnection";
import type { SearchResultsData } from "./browser/ReconstructedPage";
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

  const provider = useMemo(() => getSearchProvider(era.searchProvider), [era.searchProvider]);

  const resolution = useMemo(
    () =>
      isAboutUrl(url) ? undefined : resolveHistoricalUrl(timeWebCatalog, { url, selectedDate }),
    [url, selectedDate],
  );

  const page =
    resolution?.type === "reconstruction" ? timeWebCatalog.getPage(resolution.pageId) : undefined;

  // Time Search runs only for reconstructed pages that carry a `search-results`
  // block, with the query parameter that block declares, at the machine's date.
  const searchQuery = useMemo(() => {
    if (resolution?.type !== "reconstruction") return undefined;
    const block = page?.blocks.find((b) => b.type === "search-results");
    return block ? (resolution.url.query[block.paramName] ?? "") : undefined;
  }, [resolution, page]);

  const searchResults = useMemo<SearchResultsData | undefined>(() => {
    if (searchQuery === undefined) return undefined;
    const query = searchQuery;
    return {
      provider,
      response: search(timeSearchIndex, { query, selectedDate, limit: provider.resultsPerPage }),
    };
  }, [searchQuery, selectedDate, provider]);

  // Computer Engine: how long this page would have taken over the machine's link.
  const machine = machineCatalog.getMachine(era.machine.id);
  const loadTime = useMemo(
    () =>
      page && machine ? transferTimeMs(estimatePayloadBytes(page), machine.network) : undefined,
    [page, machine],
  );

  const audio = useAudio();
  const { track } = useAnalytics();
  const { emit } = useNarrative();
  const { connection, connect } = useNetworkConnection(era);

  // Each resolution is a measurable outcome; a temporal 404 also sounds like one.
  // The ref keeps the story from hearing the same visit twice (effects may re-run).
  const lastVisited = useRef<typeof resolution>(undefined);
  useEffect(() => {
    if (!resolution) return;
    connect(); // first real address: the modem dials (no-op once online)
    track("browser.resolved", { eraId: era.id, type: resolution.type });
    if (resolution.type === "not-found") audio.play("error");
    if (lastVisited.current === resolution) return;
    lastVisited.current = resolution;
    emit("site.visited", {
      domain: resolution.url?.domain ?? "",
      type: resolution.type,
      reason: resolution.type === "not-found" ? resolution.reason : "",
    });
    // The dated events the page shows (temporal 404 timeline, document card).
    const shown =
      resolution.type === "not-found"
        ? resolution.eventIds
        : resolution.type === "document"
          ? [resolution.eventId]
          : [];
    for (const eventId of shown) {
      const event = timeWebCatalog.getEvent(eventId);
      if (event) {
        emit("event.viewed", { eventId, title: event.title, date: event.date.slice(0, 10) });
      }
    }
  }, [resolution, era.id, track, audio, emit, connect]);

  const lastSearched = useRef<typeof searchResults>(undefined);
  useEffect(() => {
    if (!searchResults) return;
    track("search.performed", {
      eraId: era.id,
      provider: searchResults.provider.id,
      results: searchResults.response.total,
    });
    if (lastSearched.current === searchResults || !searchQuery?.trim()) return;
    lastSearched.current = searchResults;
    emit("search.executed", {
      query: searchQuery.trim(),
      results: searchResults.response.total,
      provider: searchResults.provider.id,
    });
  }, [searchResults, searchQuery, era.id, track, emit]);

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
        return (
          (searchResults
            ? `${provider.label} — ${searchResults.response.total} résultat(s) au ${selectedDate}`
            : `Reconstitution — ${resolution.url.hostname}`) +
          (loadTime !== undefined && machine
            ? ` — chargée en ${formatDuration(loadTime)} (${machine.network.label})`
            : "")
        );
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
        <span
          className="ml-auto px-1 text-xs"
          role="status"
          data-testid="browser-link"
          data-phase={connection.phase}
        >
          {connection.phase === "offline"
            ? "Hors ligne"
            : connection.phase === "dialing"
              ? "📞 Numérotation…"
              : `🔗 Connecté${machine ? ` — ${machine.network.label}` : ""}`}
        </span>
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
            searchResults={searchResults}
            onNavigate={follow}
          />
        ) : (
          <div className="tw-page" data-testid="browser-home">
            <h1 className="tw-heading">Time Browser</h1>
            <p className="tw-paragraph">
              {era.label}. Vous êtes connecté au réseau de {era.dateStart.slice(0, 4)}
              {era.network.web
                ? machine
                  ? ` via ${machine.network.label}.`
                  : "."
                : ", mais le Web n'y est pas disponible."}
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
