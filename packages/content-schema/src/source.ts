import { z } from "zod";

/**
 * How close a source is to the fact it supports (docs/historical-sources.md):
 * - `primary`: the actor itself at the time (announcement, original post,
 *   the standard or document itself, an archived original page);
 * - `institutional`: museums, standards bodies, governments, official texts;
 * - `press`: reputable press, contemporary or retrospective;
 * - `reference`: general encyclopedias (Wikipedia) — useful context, never
 *   enough on its own to support a date;
 * - `project`: written by Time Machine itself (fiction, reconstruction,
 *   representative profile) — documents our own content, supports no date.
 */
export const SourceKindSchema = z.enum([
  "primary",
  "institutional",
  "press",
  "reference",
  "project",
]);

export const SourceReferenceSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: SourceKindSchema,
  url: z.string().url().optional(),
  publisher: z.string().optional(),
  accessedAt: z.string().optional(),
  notes: z.string().optional(),
});

export type SourceKind = z.infer<typeof SourceKindSchema>;
export type SourceReference = z.infer<typeof SourceReferenceSchema>;

/** A source strong enough to support a historical date on its own. */
export function isAuthoritativeSource(source: Pick<SourceReference, "kind">): boolean {
  return source.kind === "primary" || source.kind === "institutional" || source.kind === "press";
}
