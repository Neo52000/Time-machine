import {
  NarrativeTriggerSchema,
  type NarrativeActionType,
  type NarrativeEventType,
  type NarrativeTrigger,
} from "@time-machine/content-schema";

/**
 * Events the platform actually emits today. The schema lists more
 * (`event.viewed`, `time.changed`) for the future; a trigger waiting on one
 * of those would silently never fire, so the catalogue refuses it instead.
 */
export const EMITTED_EVENTS: readonly NarrativeEventType[] = [
  "era.loaded",
  "file.opened",
  "site.visited",
  "search.executed",
  "message.received",
  "service.opened",
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
];

export interface NarrativeData {
  triggers: unknown[];
}

export interface NarrativeCatalogOptions {
  emittedEvents?: readonly NarrativeEventType[];
  performedActions?: readonly NarrativeActionType[];
}

export interface NarrativeCatalog {
  triggers: NarrativeTrigger[];
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
    }
  }
  for (const t of triggers) {
    for (const flag of t.requiresFlags ?? []) {
      if (!flagsSet.has(flag)) {
        throw new Error(`trigger ${t.id} requires flag "${flag}", which no trigger sets`);
      }
    }
  }

  return {
    triggers,
    forEra: (eraId) => triggers.filter((t) => !t.eras || t.eras.includes(eraId)),
  };
}
