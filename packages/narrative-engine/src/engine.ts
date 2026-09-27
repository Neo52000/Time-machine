import type {
  NarrativeAction,
  NarrativeCondition,
  NarrativeEventType,
  NarrativeScalar,
  NarrativeTrigger,
} from "@time-machine/content-schema";

export type NarrativeEventData = Record<string, NarrativeScalar>;

export interface NarrativeEvent {
  type: NarrativeEventType;
  data?: NarrativeEventData;
}

/** Immutable session state: per-trigger condition progress, fired triggers, flags. */
export interface NarrativeState {
  progress: Record<string, boolean[]>;
  fired: string[];
  flags: string[];
}

export interface DispatchResult {
  state: NarrativeState;
  /** Actions to perform, in order, placeholders already filled. */
  actions: NarrativeAction[];
  /** Ids of the triggers that fired during this dispatch, in firing order. */
  fired: string[];
}

export function createNarrativeState(): NarrativeState {
  return { progress: {}, fired: [], flags: [] };
}

function sameValue(expected: NarrativeScalar, actual: NarrativeScalar | undefined): boolean {
  if (typeof expected === "string" && typeof actual === "string") {
    return expected.trim().toLowerCase() === actual.trim().toLowerCase();
  }
  return expected === actual;
}

export function matchesCondition(condition: NarrativeCondition, event: NarrativeEvent): boolean {
  if (condition.event !== event.type) return false;
  const data = event.data ?? {};
  return Object.entries(condition.match ?? {}).every(([key, value]) => sameValue(value, data[key]));
}

/** Replaces `{key}` with the event's data; unknown keys are left visible, never blanked. */
export function interpolate(template: string, data: NarrativeEventData): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in data ? String(data[key]) : whole,
  );
}

function fillAction(action: NarrativeAction, data: NarrativeEventData): NarrativeAction {
  const payload = Object.fromEntries(
    Object.entries(action.payload).map(([k, v]) => [
      k,
      typeof v === "string" ? interpolate(v, data) : v,
    ]),
  );
  return { ...action, payload } as NarrativeAction;
}

/**
 * Feeds one event through the triggers. Conditions accumulate across events
 * (any order); a trigger fires once all of its conditions have been seen and
 * its required flags are set. Flags set while firing can release other
 * triggers in the same dispatch, so evaluation repeats until nothing changes —
 * bounded, since each trigger fires at most once per dispatch.
 */
export function dispatch(
  triggers: readonly NarrativeTrigger[],
  state: NarrativeState,
  event: NarrativeEvent,
): DispatchResult {
  const data = event.data ?? {};
  const alreadyFired = new Set(state.fired);
  const flags = new Set(state.flags);
  const progress: Record<string, boolean[]> = { ...state.progress };

  const live = triggers.filter((t) => !(t.once && alreadyFired.has(t.id)));
  for (const t of live) {
    const current = progress[t.id] ?? t.when.map(() => false);
    const next = current.map((seen, i) => seen || matchesCondition(t.when[i]!, event));
    progress[t.id] = next;
  }

  const actions: NarrativeAction[] = [];
  const firedNow: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of live) {
      if (firedNow.includes(t.id)) continue;
      if (!progress[t.id]!.every(Boolean)) continue;
      if (!(t.requiresFlags ?? []).every((f) => flags.has(f))) continue;

      firedNow.push(t.id);
      alreadyFired.add(t.id);
      if (!t.once) progress[t.id] = t.when.map(() => false);
      for (const action of t.actions) {
        actions.push(fillAction(action, data));
        if (action.type === "set.flag" && !flags.has(action.payload.flag)) {
          flags.add(action.payload.flag);
          changed = true;
        }
      }
    }
  }

  return {
    state: { progress, fired: [...alreadyFired], flags: [...flags] },
    actions,
    fired: firedNow,
  };
}
