import { describe, expect, it } from "vitest";
import type { EraManifest, HistoricalEvent } from "@time-machine/content-schema";
import { buildVerticalTimeline, filterTimeline, listCategories } from "./vertical";

const event = (
  id: string,
  date: string,
  category: string[],
  importance: 1 | 2 | 3 | 4 | 5 = 3,
): HistoricalEvent => ({
  id,
  date,
  title: id,
  summary: id,
  category,
  importance,
  sourceIds: [],
  published: true,
});

const era = (id: string, dateStart: string): EraManifest => ({
  id,
  label: id,
  dateStart,
  dateEnd: `${dateStart.slice(0, 4)}-12-31`,
  machine: { id: "m", resolution: { width: 1, height: 1 }, bootSequence: "b", theme: "t" },
  apps: [],
  network: { web: true, minitel: false, bbs: false, messenger: false },
  timelineTags: [],
});

const events = [
  event("late", "1998-09-04", ["web", "search"]),
  event("minor-same-day", "1998-01-01", ["web"], 2),
  event("major-same-day", "1998-01-01", ["hardware"], 5),
  event("early", "1985-03-15", ["network"]),
  { ...event("draft", "1990-01-01", ["web"]), published: false },
];
const eras = [era("1998", "1998-01-01"), era("1985", "1985-01-01")];

describe("buildVerticalTimeline", () => {
  const years = buildVerticalTimeline(events, eras);

  it("groups by year, chronologically, skipping drafts and empty years", () => {
    expect(years.map((y) => y.year)).toEqual([1985, 1998]);
  });

  it("puts an era before same-day events, then events by importance", () => {
    const ids = years[1]!.entries.map((e) => (e.kind === "era" ? `era:${e.era.id}` : e.event.id));
    expect(ids).toEqual(["era:1998", "major-same-day", "minor-same-day", "late"]);
  });
});

describe("filterTimeline", () => {
  const years = buildVerticalTimeline(events, eras);

  it("keeps everything when no category is selected", () => {
    expect(filterTimeline(years, [])).toBe(years);
  });

  it("keeps matching events and every era station", () => {
    const filtered = filterTimeline(years, ["search"]);
    const ids = filtered.flatMap((y) =>
      y.entries.map((e) => (e.kind === "era" ? `era:${e.era.id}` : e.event.id)),
    );
    expect(ids).toEqual(["era:1985", "era:1998", "late"]);
  });
});

describe("listCategories", () => {
  it("counts published events only, most used first", () => {
    expect(listCategories(events)).toEqual([
      { category: "web", count: 2 },
      { category: "hardware", count: 1 },
      { category: "network", count: 1 },
      { category: "search", count: 1 },
    ]);
  });
});
