import { describe, expect, it } from "vitest";
import type {
  EraManifest,
  HistoricalEvent,
  HistoricalWebsite,
  MachineProfile,
} from "@time-machine/content-schema";
import { buildMuseum, galleryCoverage, museum } from "./index";

const era = (id: string, year: number, machineId = `pc-${year}`): EraManifest => ({
  id,
  label: `${year}`,
  dateStart: `${year}-01-01`,
  dateEnd: `${year}-12-31`,
  machine: {
    id: machineId,
    resolution: { width: 640, height: 480 },
    bootSequence: "b",
    theme: "t",
  },
  apps: [],
  network: { web: true, minitel: false, bbs: false, messenger: false },
  timelineTags: [],
});

const event = (id: string, date: string, importance: 1 | 2 | 3 | 4 | 5 = 3): HistoricalEvent => ({
  id,
  date,
  title: id,
  summary: id,
  category: [],
  importance,
  sourceIds: ["s"],
  published: true,
});

const site = (id: string, from: string, until?: string): HistoricalWebsite => ({
  id,
  domain: `${id}.com`,
  title: id,
  category: [],
  availableFrom: from,
  ...(until ? { availableUntil: until } : {}),
  sourceIds: ["s"],
  published: true,
});

const machine: MachineProfile = {
  id: "pc-1998",
  label: "PC",
  kind: "personal-computer",
  os: "os",
  display: "d",
  network: { kind: "dial-up", label: "m", downstreamBps: 1, upstreamBps: 1, latencyMs: 0 },
  sourceIds: ["s"],
};

const sources = [{ id: "s", label: "Source", kind: "primary" as const }];

describe("buildMuseum", () => {
  const built = buildMuseum(
    {
      eras: [era("2005", 2005), era("1998", 1998)],
      events: [
        event("old-minor", "1990-01-01", 1),
        event("old-major", "1991-01-01", 5),
        event("in-1998", "1998-06-01"),
        { ...event("draft-1998", "1998-07-01"), published: false },
        { ...event("unsure-1998", "1998-02-01"), needsResearch: true },
        event("in-1999", "1999-01-01"),
        event("in-2000", "2000-01-01"),
      ],
      websites: [
        site("always", "1995-01-01"),
        site("gone", "1996-01-01", "1997-12-31"),
        site("late", "1999-01-01", "2001-01-01"),
        { ...site("draft", "1995-01-01"), published: false },
      ],
      machines: [machine],
      sources,
    },
    { backgroundLimit: 1, upcomingLimit: 1 },
  );
  const g1998 = built.getGallery("1998")!;

  it("orders galleries chronologically", () => {
    expect(built.galleries.map((g) => g.era.id)).toEqual(["1998", "2005"]);
  });

  it("splits events into before / during / after, skipping drafts", () => {
    expect(g1998.during.map((e) => e.item.id)).toEqual(["unsure-1998", "in-1998"]);
    expect(g1998.background.map((e) => e.item.id)).toEqual(["old-major"]);
    expect(g1998.upcoming.map((e) => e.item.id)).toEqual(["in-1999"]);
  });

  it("flags needs-research records instead of hiding or asserting them", () => {
    expect(g1998.during.find((e) => e.item.id === "unsure-1998")?.toConfirm).toBe(true);
    expect(g1998.during.find((e) => e.item.id === "in-1998")?.toConfirm).toBe(false);
  });

  it("lists sites online at some point during the era", () => {
    expect(g1998.online.map((s) => s.item.id)).toEqual(["always"]);
    expect(built.getGallery("2005")!.online.map((s) => s.item.id)).toEqual(["always"]);
  });

  it("attaches the machine profile with its sources when one exists", () => {
    expect(g1998.machine?.item.id).toBe("pc-1998");
    expect(g1998.machine?.sources.map((s) => s.label)).toEqual(["Source"]);
    expect(built.getGallery("2005")!.machine).toBeUndefined();
  });

  it("tells authoritative sources from encyclopedias and counts coverage", () => {
    const withWiki = buildMuseum({
      eras: [era("1998", 1998)],
      events: [
        event("strong", "1998-01-01"),
        { ...event("weak", "1998-02-01"), sourceIds: ["wiki"] },
      ],
      websites: [],
      machines: [],
      sources: [...sources, { id: "wiki", label: "Encyclopédie", kind: "reference" as const }],
    }).getGallery("1998")!;
    expect(withWiki.during.map((e) => [e.item.id, e.authoritative])).toEqual([
      ["strong", true],
      ["weak", false],
    ]);
    expect(galleryCoverage(withWiki)).toEqual({ authoritative: 1, total: 2 });
  });

  it("fails fast on a dangling source", () => {
    expect(() =>
      buildMuseum({
        eras: [era("1998", 1998)],
        events: [{ ...event("e", "1998-01-01"), sourceIds: ["ghost"] }],
        websites: [],
        machines: [],
        sources,
      }),
    ).toThrow(/unknown source "ghost"/);
  });
});

describe("shipped museum", () => {
  it("has one gallery per era, each with its machine", () => {
    expect(museum.galleries.map((g) => g.era.id)).toEqual(["1985", "1992", "1998", "2005", "2010"]);
    for (const g of museum.galleries) expect(g.machine, g.era.id).toBeDefined();
  });

  it("puts Google's founding inside 1998 and keeps Napster out of it", () => {
    const g = museum.getGallery("1998")!;
    expect(g.during.map((e) => e.item.id)).toContain("google-founded");
    expect(g.online.map((s) => s.item.id)).not.toContain("napster-com");
    expect(g.upcoming.map((e) => e.item.id)).toContain("napster-launch");
  });
});
