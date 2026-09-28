import { z } from "zod";
import { SoundEventSchema } from "./audio";

/**
 * Narrative Engine — a data-driven story layer. A trigger listens for
 * things the user does on the machine (events) and, once all of its
 * conditions have been seen, performs actions. Triggers live in
 * `content/narrative/triggers.json`; `packages/narrative-engine` evaluates
 * them and the desktop performs the resulting actions.
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
  "media.played",
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
  "award.stamp",
]);

/** Event data and match values are scalars only — nothing structured or personal. */
export const NarrativeScalarSchema = z.union([z.string(), z.number(), z.boolean()]);

export const NarrativeConditionSchema = z.object({
  event: NarrativeEventTypeSchema,
  /** Every key must equal the event's data (strings compare trimmed, case-insensitive). */
  match: z.record(z.string(), NarrativeScalarSchema).optional(),
});

/**
 * One payload shape per action type. String payload fields may contain
 * `{key}` placeholders, filled from the data of the event that fired the trigger.
 */
export const NarrativeActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("show.notification"),
    payload: z.object({ title: z.string().min(1), body: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("create.file"),
    payload: z.object({
      /** Absolute path on the virtual disk; the parent directory must exist. */
      path: z.string().regex(/^\/.+[^/]$/, "Expected an absolute file path"),
      content: z.string(),
    }),
  }),
  z.object({
    type: z.literal("unlock.site"),
    payload: z.object({ websiteId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("send.message"),
    payload: z.object({ contactId: z.string().min(1), text: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("change.desktop"),
    /** A new wallpaper colour for the rest of the session (the reward, not a theme swap). */
    payload: z.object({ wallpaper: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Expected #rrggbb") }),
  }),
  z.object({
    type: z.literal("play.sound"),
    payload: z.object({ event: SoundEventSchema }),
  }),
  z.object({
    type: z.literal("set.flag"),
    payload: z.object({ flag: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("unlock.era"),
    payload: z.object({ eraId: z.string().min(1) }),
  }),
  z.object({
    type: z.literal("award.stamp"),
    /** Stamps the visitor's passport (see `PassportStampSchema`); kept across visits. */
    payload: z.object({ stampId: z.string().min(1) }),
  }),
]);

/**
 * A passport stamp: a small achievement earned inside one era, collected on
 * the visitor's own browser and shown on the homepage. Stamps are rewards
 * for exploring, never historical claims.
 */
export const PassportStampSchema = z.object({
  id: z.string().min(1),
  eraId: z.string().min(1),
  title: z.string().min(1),
  /** How to earn it — shown once earned, and as a hint before. */
  hint: z.string().min(1),
  icon: z.string().min(1),
});

export const NarrativeTriggerSchema = z.object({
  id: z.string().min(1),
  /** Eras the trigger runs in. Omitted = every era. */
  eras: z.array(z.string().min(1)).optional(),
  /** All conditions must have been seen (in any order) since the trigger was armed. */
  when: z.array(NarrativeConditionSchema).min(1),
  /** Flags that must already be set (by a `set.flag` action) for the trigger to fire. */
  requiresFlags: z.array(z.string().min(1)).optional(),
  actions: z.array(NarrativeActionSchema).min(1),
  /** true = fires at most once per session; false = re-arms after firing. */
  once: z.boolean(),
});

export type NarrativeEventType = z.infer<typeof NarrativeEventTypeSchema>;
export type NarrativeActionType = z.infer<typeof NarrativeActionTypeSchema>;
export type NarrativeScalar = z.infer<typeof NarrativeScalarSchema>;
export type NarrativeCondition = z.infer<typeof NarrativeConditionSchema>;
export type NarrativeAction = z.infer<typeof NarrativeActionSchema>;
export type NarrativeTrigger = z.infer<typeof NarrativeTriggerSchema>;
export type PassportStamp = z.infer<typeof PassportStampSchema>;
