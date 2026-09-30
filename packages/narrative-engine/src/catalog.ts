import {
  NarrativeTriggerSchema,
  PassportStampSchema,
  type PassportStamp,
  type NarrativeActionType,
  type NarrativeEventType,
  type NarrativeTrigger,
} from "@time-machine/content-schema";
import { stampFlag } from "./engine";

/**
 * Events the platform actually emits today. The schema lists more
 * (`time.changed`: the era clock cannot be set yet); a trigger waiting on
 * one of those would silently never fire, so the catalogue refuses it instead.
 */
export const EMITTED_EVENTS: readonly NarrativeEventType[] = [
  "era.loaded",
  "file.opened",
  "site.visited",
  "search.executed",
  "message.received",
  "service.opened",
  "media.played",
  "event.viewed",
];

/**
 * Actions the platform performs today (`set.flag` is performed by the engine
 * itself). Same reasoning: an action nobody performs is refused at load.
 */
export const PERFORMED_ACTIONS: readonly NarrativeActionType[] = [
  "show.notification",
  "create.file",
  "play.sound",
  "set.flag",
  "send.message",
  "change.desktop",
  "award.stamp",
];

export interface NarrativeData {
  triggers: unknown[];
  /** Passport stamps the triggers can award. */
  stamps?: unknown[];
}

export interface NarrativeCatalogOptions {
  emittedEvents?: readonly NarrativeEventType[];
  performedActions?: readonly NarrativeActionType[];
}

export interface NarrativeCatalog {
  triggers: NarrativeTrigger[];
  stamps: PassportStamp[];
  getStamp(id: string): PassportStamp | undefined;
  /** Triggers that run in an era, in declaration order (evaluation order). */
  forEra(eraId: string): NarrativeTrigger[];
}

/** Validates every trigger and refuses anything the runtime could not honour (fail fast). */
export function createNarrativeCatalog(
  data: NarrativeData,
  options: NarrativeCatalogOptions = {},
): NarrativeCatalog {
  const emitted = new Set(options.emittedEvents ?? EMITTED_EVENTS);
  const performed = new Set(options.performedActions ?? PERFORMED_ACTIONS);
  const triggers = data.triggers.map((t) => NarrativeTriggerSchema.parse(t));
  const stamps = (data.stamps ?? []).map((s) => PassportStampSchema.parse(s));
  const stampById = new Map<string, PassportStamp>();
  for (const s of stamps) {
    if (stampById.has(s.id)) throw new Error(`Duplicate passport stamp id "${s.id}"`);
    stampById.set(s.id, s);
  }
  const awarded = new Set<string>();

  const ids = new Set<string>();
  const flagsSet = new Set<string>();
  for (const t of triggers) {
    if (ids.has(t.id)) throw new Error(`Duplicate narrative trigger id "${t.id}"`);
    ids.add(t.id);
    for (const c of t.when) {
      if (!emitted.has(c.event)) {
        throw new Error(`trigger ${t.id} waits for "${c.event}", which nothing emits yet`);
      }
    }
    for (const a of t.actions) {
      if (!performed.has(a.type)) {
        throw new Error(`trigger ${t.id} uses "${a.type}", which nothing performs yet`);
      }
      if (a.type === "set.flag") flagsSet.add(a.payload.flag);
      if (a.type === "award.stamp") {
        const stamp = stampById.get(a.payload.stampId);
        if (!stamp) {
          throw new Error(`trigger ${t.id} awards unknown stamp "${a.payload.stampId}"`);
        }
        if (t.eras && !t.eras.every((eraId) => eraId === stamp.eraId)) {
          throw new Error(`trigger ${t.id} awards stamp "${stamp.id}" outside era ${stamp.eraId}`);
        }
        awarded.add(stamp.id);
        flagsSet.add(stampFlag(stamp.id));
      }
    }
  }
  for (const t of triggers) {
    for (const flag of t.requiresFlags ?? []) {
      if (!flagsSet.has(flag)) {
        throw new Error(`trigger ${t.id} requires flag "${flag}", which no trigger sets`);
      }
    }
  }

  for (const s of stamps) {
    if (!awarded.has(s.id)) throw new Error(`passport stamp "${s.id}" is never awarded`);
  }

  return {
    triggers,
    stamps,
    getStamp: (id) => stampById.get(id),
    forEra: (eraId) => triggers.filter((t) => !t.eras || t.eras.includes(eraId)),
  };
}
