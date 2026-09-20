import { ASSET_KINDS, ALL_KINDS, type AdminState, type AdminCollectionKind } from "./store";

export type RightsSeverity = "blocking" | "review" | "research";

export interface RightsQueueEntry {
  kind: AdminCollectionKind;
  id: string;
  severity: RightsSeverity;
  reasons: string[];
}

const SEVERITY_ORDER: Record<RightsSeverity, number> = { blocking: 0, review: 1, research: 2 };

/**
 * Cross-collection review queue: every asset (`rightsStatus`-bearing record)
 * left at `"unknown"` or `"fair-use-review"`, plus every record of any kind
 * flagged `needsResearch`. `"unknown"` is a hard publish blocker
 * (docs/rights-policy.md); the rest need a human look before publishing.
 */
export function buildRightsQueue(state: AdminState): RightsQueueEntry[] {
  const entries: RightsQueueEntry[] = [];

  for (const kind of ALL_KINDS) {
    for (const [id, item] of Object.entries(state[kind])) {
      const reasons: string[] = [];
      let severity: RightsSeverity | undefined;

      if (ASSET_KINDS.has(kind) && "rightsStatus" in item.data) {
        if (item.data.rightsStatus === "unknown") {
          severity = "blocking";
          reasons.push('Rights status is "unknown" — cannot be published.');
        } else if (item.data.rightsStatus === "fair-use-review") {
          severity = "review";
          reasons.push('Marked "fair-use-review" — confirm rights before publishing.');
        }
      }

      if ("needsResearch" in item.data && item.data.needsResearch === true) {
        reasons.push("Flagged needsResearch — a fact or date is not confidently sourced.");
        if (!severity) severity = "research";
      }

      if (severity) entries.push({ kind, id, severity, reasons });
    }
  }

  return entries.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.id.localeCompare(b.id),
  );
}
