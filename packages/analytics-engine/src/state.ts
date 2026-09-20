import {
  AnalyticsEventSchema,
  type AnalyticsEvent,
  type AnalyticsEventName,
  type AnalyticsProps,
} from "@time-machine/content-schema";

/**
 * Privacy-first, pure analytics: nothing is sent until consent is granted,
 * nothing personal is accepted, and the engine never touches a network or a
 * clock — the UI provides `now`, and a sink (see `AnalyticsSink`) is handed
 * the batches `flush` returns.
 */
export type ConsentState = "unknown" | "granted" | "denied";

export interface AnalyticsState {
  consent: ConsentState;
  sessionId: string;
  /** Events accepted and waiting for the next flush. */
  queue: AnalyticsEvent[];
  /** Events recorded before the visitor answered; released on grant, dropped on denial. */
  pending: AnalyticsEvent[];
  /** Events refused (denied consent, invalid, or personal data) — a health counter. */
  dropped: number;
}

export interface AnalyticsSink {
  send(batch: AnalyticsEvent[]): void;
}

export const MAX_PENDING = 50;
export const MAX_QUEUE = 500;

/** Keys that could hold personal data, whatever the value. */
const FORBIDDEN_KEYS =
  /^(email|e-mail|mail|name|firstname|lastname|phone|tel|ip|address|user(id|name)?)$/i;
const EMAIL_LIKE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/** Injected randomness keeps the engine deterministic under test. */
export function createSessionId(random: () => number = Math.random): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) {
    id += alphabet[Math.floor(random() * alphabet.length)] ?? "0";
  }
  return id;
}

export function createAnalyticsState(options: {
  sessionId: string;
  consent?: ConsentState;
}): AnalyticsState {
  return {
    consent: options.consent ?? "unknown",
    sessionId: options.sessionId,
    queue: [],
    pending: [],
    dropped: 0,
  };
}

/** True when the props could identify someone; such an event is refused whole. */
export function containsPersonalData(props: AnalyticsProps): boolean {
  return Object.entries(props).some(
    ([key, value]) =>
      FORBIDDEN_KEYS.test(key) || (typeof value === "string" && EMAIL_LIKE.test(value)),
  );
}

export function record(
  state: AnalyticsState,
  name: AnalyticsEventName,
  props: AnalyticsProps,
  now: number,
): AnalyticsState {
  const parsed = AnalyticsEventSchema.safeParse({
    name,
    at: now,
    sessionId: state.sessionId,
    props,
  });
  if (!parsed.success || containsPersonalData(parsed.data.props)) {
    return { ...state, dropped: state.dropped + 1 };
  }
  const event = parsed.data;

  switch (state.consent) {
    case "denied":
      return { ...state, dropped: state.dropped + 1 };
    case "unknown": {
      const pending = [...state.pending, event];
      const overflow = Math.max(0, pending.length - MAX_PENDING);
      return {
        ...state,
        pending: pending.slice(overflow),
        dropped: state.dropped + overflow,
      };
    }
    case "granted": {
      const queue = [...state.queue, event];
      const overflow = Math.max(0, queue.length - MAX_QUEUE);
      return { ...state, queue: queue.slice(overflow), dropped: state.dropped + overflow };
    }
  }
}

export function setConsent(state: AnalyticsState, consent: ConsentState): AnalyticsState {
  if (consent === state.consent) return state;
  if (consent === "granted") {
    return { ...state, consent, queue: [...state.queue, ...state.pending], pending: [] };
  }
  if (consent === "denied") {
    return {
      ...state,
      consent,
      queue: [],
      pending: [],
      dropped: state.dropped + state.queue.length + state.pending.length,
    };
  }
  return { ...state, consent };
}

/** Takes up to `max` queued events out; only granted state ever yields a batch. */
export function flush(
  state: AnalyticsState,
  max = 50,
): { state: AnalyticsState; batch: AnalyticsEvent[] } {
  if (state.consent !== "granted" || state.queue.length === 0) return { state, batch: [] };
  const batch = state.queue.slice(0, max);
  return { state: { ...state, queue: state.queue.slice(batch.length) }, batch };
}

/** Event counts by name, for a local dashboard. */
export function summarize(events: AnalyticsEvent[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const event of events) counts[event.name] = (counts[event.name] ?? 0) + 1;
  return counts;
}
