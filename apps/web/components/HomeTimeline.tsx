"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { EraManifest, HistoricalEvent, SourceReference } from "@time-machine/content-schema";
import {
  filterTimeline,
  type CategoryCount,
  type TimelineYear,
} from "@time-machine/timeline-engine";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { EraStampCount } from "./Passport";

const CATEGORY_LABELS: Record<string, string> = {
  web: "Web",
  network: "Réseau",
  software: "Logiciel",
  hardware: "Matériel",
  search: "Recherche",
  social: "Réseaux sociaux",
  messaging: "Messagerie",
  video: "Vidéo",
  culture: "Culture",
  commerce: "Commerce",
  economy: "Économie",
  mobile: "Mobile",
  security: "Sécurité",
  minitel: "Minitel",
  telecom: "Télécoms",
  france: "France",
  ai: "IA",
  education: "Éducation",
  law: "Droit",
  world: "Monde",
};

/** Nearly every event is "world": as a filter it would select everything. */
const HIDDEN_FILTERS = new Set(["world"]);

const labelOf = (category: string) => CATEGORY_LABELS[category] ?? category;

// Fixed locale + UTC so server and client render the same string.
const dayFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });
const formatDay = (iso: string) => dayFormat.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`));

interface HomeTimelineProps {
  years: TimelineYear[];
  categories: CategoryCount[];
  /** Only the sources the events cite, keyed by id. */
  sources: Record<string, SourceReference>;
  todayYear: number;
}

/**
 * Home timeline, vertical: one readable column from 1980 to today at any
 * screen width. Playable eras are stations in the stream; events carry
 * their date, categories, sources and an "à vérifier" flag when unsure.
 */
export function HomeTimeline({ years, categories, sources, todayYear }: HomeTimelineProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const visible = useMemo(() => filterTimeline(years, selected), [years, selected]);
  const filters = categories.filter((c) => !HIDDEN_FILTERS.has(c.category));

  const decades = useMemo(() => {
    const firstYearOfDecade = new Map<number, number>();
    for (const { year } of visible) {
      const decade = Math.floor(year / 10) * 10;
      if (!firstYearOfDecade.has(decade)) firstYearOfDecade.set(decade, year);
    }
    return [...firstYearOfDecade];
  }, [visible]);

  function toggle(category: string) {
    setSelected((list) =>
      list.includes(category) ? list.filter((c) => c !== category) : [...list, category],
    );
  }

  return (
    <div className="w-full max-w-2xl" data-testid="timeline">
      <nav
        className="sticky top-0 z-10 -mx-4 mb-6 flex gap-4 overflow-x-auto border-b border-neutral-800 bg-[#050505]/90 px-4 py-3 text-xs backdrop-blur"
        aria-label="Aller à une décennie"
      >
        {decades.map(([decade, year]) => (
          <a
            key={decade}
            href={`#year-${year}`}
            className="shrink-0 text-neutral-400 hover:text-white focus-visible:text-white"
            data-testid={`decade-${decade}`}
          >
            {decade}s
          </a>
        ))}
        <a
          href="#today"
          className="ml-auto shrink-0 text-neutral-400 hover:text-white focus-visible:text-white"
        >
          Aujourd&apos;hui
        </a>
      </nav>

      <fieldset className="mb-10 min-w-0">
        <legend className="mb-2 text-xs uppercase tracking-widest text-neutral-500">
          Filtrer les événements
        </legend>
        {/* One scrollable row on a phone, wrapped lines from sm up. */}
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          data-testid="timeline-filters"
        >
          {filters.map(({ category, count }) => {
            const active = selected.includes(category);
            return (
              <button
                key={category}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(category)}
                className={`shrink-0 border px-2 py-1 text-xs transition-colors ${
                  active
                    ? "border-white bg-white text-black"
                    : "border-neutral-700 text-neutral-400 hover:border-neutral-400 hover:text-neutral-200"
                }`}
                data-testid={`filter-${category}`}
              >
                {labelOf(category)} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="shrink-0 px-2 py-1 text-xs text-neutral-500 underline hover:text-neutral-200"
              data-testid="filter-reset"
            >
              Tout afficher
            </button>
          )}
        </div>
      </fieldset>

      <ol className="relative border-l border-neutral-800">
        {visible.map(({ year, entries }) => (
          <li key={year} id={`year-${year}`} className="scroll-mt-16 pb-8">
            <h2 className="-ml-px mb-4 border-l-2 border-neutral-400 pl-4 text-2xl font-bold text-white">
              {year}
            </h2>
            <ol className="space-y-6">
              {entries.map((entry) =>
                entry.kind === "era" ? (
                  <EraStation key={`era-${entry.era.id}`} era={entry.era} />
                ) : (
                  <EventItem key={entry.event.id} event={entry.event} sources={sources} />
                ),
              )}
            </ol>
          </li>
        ))}
        <li id="today" className="scroll-mt-16 pl-4" data-testid="timeline-today">
          <h2 className="-ml-px border-l-2 border-white pl-4 text-2xl font-bold text-white">
            {todayYear} · Aujourd&apos;hui
          </h2>
        </li>
      </ol>
    </div>
  );
}

function EraStation({ era }: { era: EraManifest }) {
  const { track } = useAnalytics();
  return (
    <li
      id={`era-${era.id}`}
      className="relative scroll-mt-16 pl-6"
      data-testid={`timeline-era-${era.id}`}
    >
      <span className="absolute -left-[7px] top-5 h-3 w-3 rotate-45 bg-emerald-400" aria-hidden />
      <div className="border border-emerald-700/60 bg-emerald-950/20 p-4">
        <p className="text-[10px] uppercase tracking-widest text-emerald-400">Machine disponible</p>
        <h3 className="mt-1 text-lg font-bold text-white">{era.label}</h3>
        <p className="mt-1 text-xs text-neutral-400">
          Du {formatDay(era.dateStart)} au {formatDay(era.dateEnd)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
          <Link
            href={`/era/${era.id}/loading`}
            onClick={() => track("era.selected", { eraId: era.id })}
            className="border border-emerald-400 px-3 py-1.5 text-emerald-300 hover:bg-emerald-400 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            data-testid={`era-marker-${era.id}`}
          >
            Démarrer la machine →
          </Link>
          <Link
            href={`/museum/${era.id}`}
            className="text-xs text-neutral-400 underline hover:text-neutral-200"
          >
            Salle du musée
          </Link>
          <EraStampCount eraId={era.id} />
        </div>
      </div>
    </li>
  );
}

function EventItem({
  event,
  sources,
}: {
  event: HistoricalEvent;
  sources: Record<string, SourceReference>;
}) {
  const major = event.importance >= 5;
  const cited = event.sourceIds.flatMap((id) => (sources[id] ? [sources[id]] : []));
  return (
    <li className="relative pl-6" data-testid={`timeline-event-${event.id}`}>
      <span
        className={`absolute rounded-full ${
          major
            ? "-left-[6px] top-1 h-[11px] w-[11px] bg-white"
            : "-left-[4px] top-1.5 h-[7px] w-[7px] bg-neutral-500"
        }`}
        aria-hidden
      />
      <p className="text-xs text-neutral-500">
        <time dateTime={event.date}>{formatDay(event.date)}</time>
        {event.needsResearch && (
          <span
            className="ml-2 border border-amber-700 px-1 text-[10px] uppercase text-amber-500"
            title="Date ou détail à confirmer par une source primaire"
          >
            à vérifier
          </span>
        )}
      </p>
      <h3
        className={`mt-0.5 ${major ? "text-base font-bold text-white" : "text-sm font-bold text-neutral-200"}`}
      >
        {event.title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-neutral-400">{event.summary}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-600">
        {event.category
          .filter((c) => !HIDDEN_FILTERS.has(c))
          .map((c) => (
            <span key={c}>#{labelOf(c)}</span>
          ))}
        {cited.length > 0 && (
          <details className="w-full">
            <summary className="cursor-pointer text-neutral-500 hover:text-neutral-300">
              Sources ({cited.length})
            </summary>
            <ul className="mt-1 space-y-0.5">
              {cited.map((s) =>
                s.url ? (
                  <li key={s.id}>
                    <a
                      href={s.url}
                      className="underline hover:text-neutral-300"
                      rel="noreferrer"
                      target="_blank"
                    >
                      {s.label}
                    </a>
                  </li>
                ) : (
                  <li key={s.id}>{s.label}</li>
                ),
              )}
            </ul>
          </details>
        )}
      </div>
    </li>
  );
}
