import { z } from "zod";
import { RightsStatusSchema } from "./rights";

export const HistoricalWebsiteSchema = z.object({
  id: z.string(),
  domain: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.array(z.string()),
  availableFrom: z.string(),
  availableUntil: z.string().optional(),
  sourceIds: z.array(z.string()),
});

export const SnapshotTypeSchema = z.enum(["reconstruction", "archive", "screenshot", "document"]);

export const HistoricalSnapshotSchema = z.object({
  id: z.string(),
  websiteId: z.string(),
  capturedAt: z.string(),
  type: SnapshotTypeSchema,
  contentRef: z.string(),
  sourceIds: z.array(z.string()),
  rightsStatus: RightsStatusSchema,
});

export type HistoricalWebsite = z.infer<typeof HistoricalWebsiteSchema>;
export type SnapshotType = z.infer<typeof SnapshotTypeSchema>;
export type HistoricalSnapshot = z.infer<typeof HistoricalSnapshotSchema>;
