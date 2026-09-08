import { z } from "zod";

export const EventImportanceSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const HistoricalEventSchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.array(z.string()),
  importance: EventImportanceSchema,
  experienceId: z.string().optional(),
  sourceIds: z.array(z.string()),
  assetIds: z.array(z.string()).optional(),
  needsResearch: z.boolean().optional(),
});

export type EventImportance = z.infer<typeof EventImportanceSchema>;
export type HistoricalEvent = z.infer<typeof HistoricalEventSchema>;
