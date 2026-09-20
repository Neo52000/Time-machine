import {
  HistoricalEventSchema,
  HistoricalSnapshotSchema,
  HistoricalWebsiteSchema,
  SourceReferenceSchema,
  blockingReason,
  type HistoricalEvent,
  type HistoricalSnapshot,
  type HistoricalWebsite,
  type SourceReference,
} from "@time-machine/content-schema";
import type { CollectionConfig } from "./contentStore";

function eventPublishGuard(record: HistoricalEvent): string | null {
  if (!record.published) return null;
  const reason = blockingReason(record);
  return reason ? `Event "${record.id}" cannot be published: ${reason}.` : null;
}

function snapshotPublishGuard(record: HistoricalSnapshot): string | null {
  if (!record.published) return null;
  const reason = blockingReason(record);
  return reason ? `Snapshot "${record.id}" cannot be published: ${reason}.` : null;
}

function websitePublishGuard(record: HistoricalWebsite): string | null {
  if (!record.published) return null;
  const reason = blockingReason(record);
  return reason ? `Website "${record.id}" cannot be published: ${reason}.` : null;
}

export const eventsCollection: CollectionConfig<HistoricalEvent> = {
  file: "events/events.json",
  schema: HistoricalEventSchema,
  assertPublishable: eventPublishGuard,
};

export const websitesCollection: CollectionConfig<HistoricalWebsite> = {
  file: "websites/websites.json",
  schema: HistoricalWebsiteSchema,
  assertPublishable: websitePublishGuard,
};

export const snapshotsCollection: CollectionConfig<HistoricalSnapshot> = {
  file: "snapshots/snapshots.json",
  schema: HistoricalSnapshotSchema,
  assertPublishable: snapshotPublishGuard,
};

export const sourcesCollection: CollectionConfig<SourceReference> = {
  file: "sources/sources.json",
  schema: SourceReferenceSchema,
};

export const collections = {
  events: eventsCollection,
  websites: websitesCollection,
  snapshots: snapshotsCollection,
  sources: sourcesCollection,
} as const;

export type CollectionKey = keyof typeof collections;
