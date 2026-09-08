import { z } from "zod";

/**
 * Rights status of a historical asset/snapshot.
 * `original` = era-inspired reconstruction authored by this project (no
 * third-party material). `unknown` must never be publishable — enforced in
 * the admin, not here.
 */
export const RightsStatusSchema = z.enum([
  "original",
  "public-domain",
  "licensed",
  "permission-granted",
  "fair-use-review",
  "reference-only",
  "unknown",
]);

export type RightsStatus = z.infer<typeof RightsStatusSchema>;
