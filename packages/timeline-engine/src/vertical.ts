import type { EraManifest, HistoricalEvent } from "@time-machine/content-schema";

/**
 * Vertical timeline — one column, read top to bottom, identical on a phone
 * and a wide screen. Events and playable eras share one chronological
 * stream; an era is placed at its start date, before events of the same day.
 */
export type TimelineEntry =
  | { kind: "era"; date: string; era: EraManifest }
  | { kind: "event"; date: string; event: HistoricalEvent };

export interface TimelineYear {
  year: number;
  entries: TimelineEntry[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

const yearOf = (date: string) => Number(date.slice(0, 4));

/** Published events + eras, chronological, grouped by year (empty years are omitted). */
export function buildVerticalTimeline(
  events: HistoricalEvent[],
  eras: EraManifest[],
): TimelineYear[] {
  const entries: TimelineEntry[] = [
    ...eras.map((era): TimelineEntry => ({ kind: "era", date: era.dateStart, era })),
    ...events
      .filter((event) => event.published)
      .map((event): TimelineEntry => ({ kind: "event", date: event.date, event })),
  ].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      // Same day: the era station first, then events by decreasing importance.
      (a.kind === b.kind ? 0 : a.kind === "era" ? -1 : 1) ||
      (a.kind === "event" && b.kind === "event" ? b.event.importance - a.event.importance : 0),
  );

  const years: TimelineYear[] = [];
  for (const entry of entries) {
    const year = yearOf(entry.date);
    const last = years.at(-1);
    if (last?.year === year) last.entries.push(entry);
    else years.push({ year, entries: [entry] });
  }
  return years;
}

/** Categories used by published events, most used first (ties alphabetical). */
export function listCategories(events: HistoricalEvent[]): CategoryCount[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (!event.published) continue;
    for (const category of event.category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

/** Keeps era stations; keeps an event when it matches any selected category (none = all). */
export function filterTimeline(years: TimelineYear[], categories: string[]): TimelineYear[] {
  if (categories.length === 0) return years;
  return years
    .map((y) => ({
      year: y.year,
      entries: y.entries.filter(
        (e) => e.kind === "era" || e.event.category.some((c) => categories.includes(c)),
      ),
    }))
    .filter((y) => y.entries.length > 0);
}
