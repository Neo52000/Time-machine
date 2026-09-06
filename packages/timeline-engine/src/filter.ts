import type { HistoricalEvent } from "@time-machine/content-schema";

/**
 * An event is reachable on the timeline once its date has passed relative
 * to the selected date — there is no "availableUntil" for events (unlike
 * websites/search documents, which can also disappear).
 */
export function isEventVisible(
  event: Pick<HistoricalEvent, "date">,
  selectedDate: string,
): boolean {
  return event.date <= selectedDate;
}

export function filterByDate(events: HistoricalEvent[], selectedDate: string): HistoricalEvent[] {
  return events.filter((event) => isEventVisible(event, selectedDate));
}

export function filterByCategory(
  events: HistoricalEvent[],
  categories: string[],
): HistoricalEvent[] {
  if (categories.length === 0) return events;
  return events.filter((event) => event.category.some((c) => categories.includes(c)));
}

export function sortByDate(
  events: HistoricalEvent[],
  direction: "asc" | "desc" = "asc",
): HistoricalEvent[] {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return direction === "asc" ? sorted : sorted.reverse();
}

export function sortByImportance(events: HistoricalEvent[]): HistoricalEvent[] {
  return [...events].sort((a, b) => b.importance - a.importance);
}
