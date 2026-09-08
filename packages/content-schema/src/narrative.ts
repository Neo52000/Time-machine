import { z } from "zod";

/**
 * Narrative Engine — prepared for a future story layer (e.g. LOST), not
 * fully implemented in the MVP. Only the data contracts live here.
 */
export const NarrativeEventTypeSchema = z.enum([
  "file.opened",
  "site.visited",
  "search.executed",
  "message.received",
  "service.opened",
  "era.loaded",
  "event.viewed",
  "time.changed",
]);

export const NarrativeActionTypeSchema = z.enum([
  "show.notification",
  "create.file",
  "unlock.site",
  "send.message",
  "change.desktop",
  "play.sound",
  "set.flag",
  "unlock.era",
]);

export const NarrativeConditionSchema = z.object({
  event: NarrativeEventTypeSchema,
  match: z.record(z.string(), z.unknown()).optional(),
});

export const NarrativeActionSchema = z.object({
  type: NarrativeActionTypeSchema,
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const NarrativeTriggerSchema = z.object({
  id: z.string(),
  when: z.array(NarrativeConditionSchema),
  actions: z.array(NarrativeActionSchema),
  once: z.boolean(),
});

export type NarrativeEventType = z.infer<typeof NarrativeEventTypeSchema>;
export type NarrativeActionType = z.infer<typeof NarrativeActionTypeSchema>;
export type NarrativeCondition = z.infer<typeof NarrativeConditionSchema>;
export type NarrativeAction = z.infer<typeof NarrativeActionSchema>;
export type NarrativeTrigger = z.infer<typeof NarrativeTriggerSchema>;
