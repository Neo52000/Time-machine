import type { HistoricalEvent } from "@time-machine/content-schema";

/**
 * Naive keyword search over title/summary. Not a replacement for the
 * PostgreSQL FTS-backed Time Search Engine (§15) — this is timeline-local
 * filtering of already-loaded event data.
 */
export function searchEvents(events: HistoricalEvent[], query: string): HistoricalEvent[] {
  const q = query.trim().toLowerCase();
  if (!q) return events;
  return events.filter(
    (event) => event.title.toLowerCase().includes(q) || event.summary.toLowerCase().includes(q),
  );
}
