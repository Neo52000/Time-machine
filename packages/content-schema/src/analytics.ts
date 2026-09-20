import { z } from "zod";

/**
 * Product analytics events. Names are a closed list so a typo cannot create
 * a new metric, and props are restricted to scalars so nothing structured
 * (or personal) can be smuggled in.
 */
export const AnalyticsEventNameSchema = z.enum([
  "era.selected",
  "boot.completed",
  "app.opened",
  "browser.resolved",
  "search.performed",
  "minitel.connected",
  "messenger.sent",
  "media.played",
  "admin.published",
  "audio.toggled",
]);

export const AnalyticsPropsSchema = z.record(
  z.string().min(1),
  z.union([z.string(), z.number(), z.boolean()]),
);

export const AnalyticsEventSchema = z.object({
  name: AnalyticsEventNameSchema,
  /** Epoch milliseconds, supplied by the caller — the engine has no clock. */
  at: z.number().int().nonnegative(),
  /** Random, per-visit id; never derived from anything identifying. */
  sessionId: z.string().min(1),
  props: AnalyticsPropsSchema,
});

export type AnalyticsEventName = z.infer<typeof AnalyticsEventNameSchema>;
export type AnalyticsProps = z.infer<typeof AnalyticsPropsSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
