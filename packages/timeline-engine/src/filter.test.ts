import { describe, expect, it } from "vitest";
import type { HistoricalEvent } from "@time-machine/content-schema";
import { filterByCategory, isEventVisible, sortByDate, sortByImportance } from "./filter";
import { searchEvents } from "./search";

const events: HistoricalEvent[] = [
  {
    id: "google",
    date: "1998-09-04",
    title: "Fondation de Google",
    summary: "Larry Page et Sergey Brin fondent Google.",
    category: ["search", "web"],
    importance: 5,
    sourceIds: ["src-google"],
  },
  {
    id: "napster",
    date: "1999-06-01",
    title: "Lancement de Napster",
    summary: "Partage de fichiers musicaux peer-to-peer.",
    category: ["web", "culture"],
    importance: 4,
    sourceIds: ["src-napster"],
  },
  {
    id: "yahoo",
    date: "1994-01-01",
    title: "Fondation de Yahoo!",
    summary: "Annuaire Web fondé par Jerry Yang et David Filo.",
    category: ["web", "search"],
    importance: 3,
    sourceIds: ["src-yahoo"],
  },
];

describe("timeline date filtering", () => {
  it("hides events after the selected date", () => {
    expect(isEventVisible(events[0]!, "1998-01-01")).toBe(false);
    expect(isEventVisible(events[0]!, "1998-09-04")).toBe(true);
    expect(isEventVisible(events[0]!, "2000-01-01")).toBe(true);
  });

  it("is inclusive on the event's own date (boundary)", () => {
    expect(isEventVisible({ date: "1998-09-04" }, "1998-09-04")).toBe(true);
  });
});

describe("timeline category filtering", () => {
  it("returns all events when no category filter is given", () => {
    expect(filterByCategory(events, [])).toHaveLength(3);
  });

  it("filters to events matching at least one category", () => {
    const result = filterByCategory(events, ["culture"]);
    expect(result.map((e) => e.id)).toEqual(["napster"]);
  });
});

describe("timeline sorting", () => {
  it("sorts by date ascending by default", () => {
    expect(sortByDate(events).map((e) => e.id)).toEqual(["yahoo", "google", "napster"]);
  });

  it("sorts by date descending", () => {
    expect(sortByDate(events, "desc").map((e) => e.id)).toEqual(["napster", "google", "yahoo"]);
  });

  it("sorts by importance descending", () => {
    expect(sortByImportance(events).map((e) => e.id)).toEqual(["google", "napster", "yahoo"]);
  });
});

describe("timeline search", () => {
  it("matches on title case-insensitively", () => {
    expect(searchEvents(events, "GOOGLE").map((e) => e.id)).toEqual(["google"]);
  });

  it("matches on summary content", () => {
    expect(searchEvents(events, "peer-to-peer").map((e) => e.id)).toEqual(["napster"]);
  });

  it("returns all events for an empty query", () => {
    expect(searchEvents(events, "  ")).toHaveLength(3);
  });
});
