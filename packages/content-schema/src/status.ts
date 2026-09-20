import type { RightsStatus } from "./rights";

/**
 * The four-state admin view from the master build prompt (§26): a record is
 * NEEDS RESEARCH or NEEDS RIGHTS REVIEW before it's even a candidate to go
 * live, READY once those are cleared but not yet published, or PUBLISHED.
 */
export type ContentStatus = "needs-research" | "needs-rights-review" | "ready" | "published";

export interface StatusInput {
  published?: boolean;
  needsResearch?: boolean;
  rightsStatus?: RightsStatus;
}

/** Why a record may not be published, or null if there is no blocker. */
export function blockingReason(record: StatusInput): string | null {
  if (record.needsResearch) return "flagged as needing research (needsResearch: true)";
  if (record.rightsStatus === "unknown") return 'rights status is "unknown"';
  return null;
}

export function contentStatus(record: StatusInput): ContentStatus {
  if (record.needsResearch) return "needs-research";
  if (record.rightsStatus === "unknown") return "needs-rights-review";
  return record.published ? "published" : "ready";
}
