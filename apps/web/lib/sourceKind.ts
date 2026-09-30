import type { SourceKind, SourceReference } from "@time-machine/content-schema";

/** French badge for the kinds that carry a date; encyclopedias and our own notes get none. */
export const SOURCE_KIND_LABEL: Record<SourceKind, string | null> = {
  primary: "primaire",
  institutional: "institutionnelle",
  press: "presse",
  reference: null,
  project: null,
};

const RANK: Record<SourceKind, number> = {
  primary: 0,
  institutional: 1,
  press: 2,
  reference: 3,
  project: 4,
};

/** Strongest sources first, citation order otherwise. */
export function bySourceStrength(sources: SourceReference[]): SourceReference[] {
  return sources
    .map((s, i) => ({ s, i }))
    .sort((a, b) => RANK[a.s.kind] - RANK[b.s.kind] || a.i - b.i)
    .map(({ s }) => s);
}
