import {
  HistoricalEventSchema,
  HistoricalSnapshotSchema,
  HistoricalWebsiteSchema,
  MinitelServiceSchema,
  SourceReferenceSchema,
  VideoClipSchema,
  blockingReason,
  type HistoricalEvent,
  type HistoricalSnapshot,
  type HistoricalWebsite,
  type MinitelService,
  type SourceReference,
  type VideoClip,
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

function minitelServicePublishGuard(record: MinitelService): string | null {
  if (!record.published) return null;
  const reason = blockingReason(record);
  return reason ? `Minitel service "${record.id}" cannot be published: ${reason}.` : null;
}

function videoClipPublishGuard(record: VideoClip): string | null {
  if (!record.published) return null;
  const reason = blockingReason(record);
  return reason ? `Video clip "${record.id}" cannot be published: ${reason}.` : null;
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

export const minitelServicesCollection: CollectionConfig<MinitelService> = {
  file: "minitel/services.json",
  schema: MinitelServiceSchema,
  assertPublishable: minitelServicePublishGuard,
};

export const videoClipsCollection: CollectionConfig<VideoClip> = {
  file: "media/videos.json",
  schema: VideoClipSchema,
  assertPublishable: videoClipPublishGuard,
};

export const collections = {
  events: eventsCollection,
  websites: websitesCollection,
  snapshots: snapshotsCollection,
  sources: sourcesCollection,
  "minitel-services": minitelServicesCollection,
  "video-clips": videoClipsCollection,
} as const;

export type CollectionKey = keyof typeof collections;
