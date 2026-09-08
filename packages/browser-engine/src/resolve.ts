import type { HistoricalSnapshot, HistoricalWebsite } from "@time-machine/content-schema";
import type { TimeWebCatalog } from "./catalog";
import { normalizeUrl, type ParsedUrl } from "./url";

/**
 * Time Web resolution flow (master prompt §12), in order:
 *   1. local interactive reconstruction
 *   2. prepared historical snapshot (screenshot / document)
 *   3. allow-listed remote archive
 *   4. historical document (a related HistoricalEvent)
 *   5. documentary card for the website
 *   6. temporal 404
 * A snapshot is only eligible if it was captured on or before the selected
 * date and its rights are not "unknown" (docs/rights-policy.md).
 */
export type NotFoundReason =
  "invalid-url" | "domain-unknown" | "not-yet-online" | "no-longer-online" | "page-unknown";

export type HistoricalUrlResolution =
  | {
      type: "reconstruction";
      url: ParsedUrl;
      websiteId: string;
      snapshotId: string;
      pageId: string;
    }
  | { type: "snapshot"; url: ParsedUrl; websiteId: string; snapshotId: string }
  | { type: "archive"; url: ParsedUrl; websiteId: string; snapshotId: string; archiveUrl: string }
  | { type: "document"; url: ParsedUrl; websiteId: string; eventId: string }
  | { type: "website-card"; url: ParsedUrl; websiteId: string }
  | {
      type: "not-found";
      url: ParsedUrl | undefined;
      reason: NotFoundReason;
      websiteId?: string;
      /** Events that explain the 404 (site launches later / closed earlier). */
      eventIds: string[];
    };

export interface ResolveInput {
  url: string;
  /** ISO date (YYYY-MM-DD) the machine is currently at. */
  selectedDate: string;
}

/** Remote archives the product may point to (never render inline). */
export const ARCHIVE_HOST_ALLOWLIST: readonly string[] = ["web.archive.org"];

export function isAllowedArchiveUrl(archiveUrl: string): boolean {
  try {
    const host = new URL(archiveUrl).hostname.toLowerCase();
    return ARCHIVE_HOST_ALLOWLIST.includes(host);
  } catch {
    return false;
  }
}

function isOnlineAt(website: HistoricalWebsite, date: string): "yes" | "not-yet" | "no-longer" {
  if (website.availableFrom > date) return "not-yet";
  if (website.availableUntil && website.availableUntil < date) return "no-longer";
  return "yes";
}

function eligibleSnapshots(snapshots: HistoricalSnapshot[], date: string): HistoricalSnapshot[] {
  return snapshots
    .filter((s) => s.rightsStatus !== "unknown" && s.capturedAt <= date)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)); // most recent first
}

export function resolveHistoricalUrl(
  catalog: TimeWebCatalog,
  input: ResolveInput,
): HistoricalUrlResolution {
  const url = normalizeUrl(input.url);
  if (!url || url.scheme === "about") {
    return { type: "not-found", url, reason: "invalid-url", eventIds: [] };
  }

  const website = catalog.findWebsiteByHost(url.hostname);
  if (!website) {
    return { type: "not-found", url, reason: "domain-unknown", eventIds: [] };
  }

  const online = isOnlineAt(website, input.selectedDate);
  if (online !== "yes") {
    return {
      type: "not-found",
      url,
      reason: online === "not-yet" ? "not-yet-online" : "no-longer-online",
      websiteId: website.id,
      eventIds: website.relatedEventIds ?? [],
    };
  }

  const snapshots = eligibleSnapshots(catalog.snapshotsOf(website.id), input.selectedDate);

  // 1. Local interactive reconstruction.
  const reconstruction = snapshots.find((s) => s.type === "reconstruction");
  if (reconstruction) {
    const pages = catalog.pagesOf(website.id);
    const page = pages.find((p) => p.path === url.pathname);
    if (page) {
      return {
        type: "reconstruction",
        url,
        websiteId: website.id,
        snapshotId: reconstruction.id,
        pageId: page.id,
      };
    }
    return {
      type: "not-found",
      url,
      reason: "page-unknown",
      websiteId: website.id,
      eventIds: [],
    };
  }

  // 2. Prepared snapshot (screenshot or document).
  const prepared = snapshots.find((s) => s.type === "screenshot" || s.type === "document");
  if (prepared) {
    return { type: "snapshot", url, websiteId: website.id, snapshotId: prepared.id };
  }

  // 3. Allow-listed remote archive.
  const archive = snapshots.find((s) => s.type === "archive" && isAllowedArchiveUrl(s.contentRef));
  if (archive) {
    return {
      type: "archive",
      url,
      websiteId: website.id,
      snapshotId: archive.id,
      archiveUrl: archive.contentRef,
    };
  }

  // 4. Historical document: an event that documents the site.
  const eventId = (website.relatedEventIds ?? []).find((id) => catalog.getEvent(id));
  if (eventId) {
    return { type: "document", url, websiteId: website.id, eventId };
  }

  // 5. Documentary card.
  return { type: "website-card", url, websiteId: website.id };
}
