import {
  HistoricalEventSchema,
  HistoricalSnapshotSchema,
  HistoricalWebsiteSchema,
  ReconstructedPageSchema,
  SourceReferenceSchema,
  type HistoricalEvent,
  type HistoricalSnapshot,
  type HistoricalWebsite,
  type ReconstructedPage,
  type SourceReference,
} from "@time-machine/content-schema";
import { hostMatchesDomain } from "./url";

/**
 * Time Web catalogue — every website, snapshot, reconstruction, event and
 * source the internal browser can resolve against. Built from JSON content
 * and validated at construction (fail fast on malformed data) plus checked
 * for referential integrity so a dangling id never surfaces as a runtime
 * bug in the UI.
 */
export interface TimeWebData {
  websites: unknown[];
  snapshots: unknown[];
  pages: unknown[];
  events: unknown[];
  sources: unknown[];
}

export interface TimeWebCatalog {
  websites: HistoricalWebsite[];
  snapshots: HistoricalSnapshot[];
  pages: ReconstructedPage[];
  events: HistoricalEvent[];
  sources: SourceReference[];
  findWebsiteByHost(hostname: string): HistoricalWebsite | undefined;
  getWebsite(id: string): HistoricalWebsite | undefined;
  getSnapshot(id: string): HistoricalSnapshot | undefined;
  getPage(id: string): ReconstructedPage | undefined;
  getEvent(id: string): HistoricalEvent | undefined;
  getSource(id: string): SourceReference | undefined;
  snapshotsOf(websiteId: string): HistoricalSnapshot[];
  pagesOf(websiteId: string): ReconstructedPage[];
}

export function createTimeWebCatalog(data: TimeWebData): TimeWebCatalog {
  const websites = data.websites.map((w) => HistoricalWebsiteSchema.parse(w));
  const snapshots = data.snapshots.map((s) => HistoricalSnapshotSchema.parse(s));
  const pages = data.pages.map((p) => ReconstructedPageSchema.parse(p));
  const events = data.events.map((e) => HistoricalEventSchema.parse(e));
  const sources = data.sources.map((s) => SourceReferenceSchema.parse(s));

  const byId = <T extends { id: string }>(items: T[], kind: string) => {
    const map = new Map<string, T>();
    for (const item of items) {
      if (map.has(item.id)) throw new Error(`Duplicate ${kind} id "${item.id}"`);
      map.set(item.id, item);
    }
    return map;
  };
  const websiteById = byId(websites, "website");
  const snapshotById = byId(snapshots, "snapshot");
  const pageById = byId(pages, "page");
  const eventById = byId(events, "event");
  const sourceById = byId(sources, "source");

  const assertRef = (map: Map<string, unknown>, id: string, what: string, owner: string) => {
    if (!map.has(id)) throw new Error(`${owner} references unknown ${what} "${id}"`);
  };
  for (const w of websites) {
    for (const id of w.sourceIds) assertRef(sourceById, id, "source", `website ${w.id}`);
    for (const id of w.relatedEventIds ?? []) assertRef(eventById, id, "event", `website ${w.id}`);
  }
  for (const s of snapshots) {
    assertRef(websiteById, s.websiteId, "website", `snapshot ${s.id}`);
    for (const id of s.sourceIds) assertRef(sourceById, id, "source", `snapshot ${s.id}`);
    if (s.type === "reconstruction") assertRef(pageById, s.contentRef, "page", `snapshot ${s.id}`);
  }
  for (const p of pages) assertRef(websiteById, p.websiteId, "website", `page ${p.id}`);

  const snapshotsByWebsite = new Map<string, HistoricalSnapshot[]>();
  for (const s of snapshots) {
    snapshotsByWebsite.set(s.websiteId, [...(snapshotsByWebsite.get(s.websiteId) ?? []), s]);
  }
  const pagesByWebsite = new Map<string, ReconstructedPage[]>();
  for (const p of pages) {
    pagesByWebsite.set(p.websiteId, [...(pagesByWebsite.get(p.websiteId) ?? []), p]);
  }

  return {
    websites,
    snapshots,
    pages,
    events,
    sources,
    findWebsiteByHost: (hostname) =>
      websites
        .filter((w) => hostMatchesDomain(hostname, w.domain))
        // Longest domain wins so "mail.yahoo.com" prefers a "mail.yahoo.com" entry over "yahoo.com".
        .sort((a, b) => b.domain.length - a.domain.length)[0],
    getWebsite: (id) => websiteById.get(id),
    getSnapshot: (id) => snapshotById.get(id),
    getPage: (id) => pageById.get(id),
    getEvent: (id) => eventById.get(id),
    getSource: (id) => sourceById.get(id),
    snapshotsOf: (websiteId) => snapshotsByWebsite.get(websiteId) ?? [],
    pagesOf: (websiteId) => pagesByWebsite.get(websiteId) ?? [],
  };
}
