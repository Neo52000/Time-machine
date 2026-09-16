import { AnalyticsEventSchema, type AnalyticsEvent } from "@time-machine/content-schema";
import type { ConsentState } from "@time-machine/analytics-engine";

export const CONSENT_STORAGE_KEY = "time-machine-analytics-consent";
export const EVENTS_STORAGE_KEY = "time-machine-analytics-events";
/** The local sink is a ring buffer: enough to inspect a session, never a log. */
export const MAX_STORED_EVENTS = 200;

export function readConsent(): ConsentState {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw === "granted" || raw === "denied" ? raw : "unknown";
  } catch {
    return "unknown";
  }
}

export function writeConsent(consent: ConsentState): void {
  try {
    if (consent === "unknown") window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    else window.localStorage.setItem(CONSENT_STORAGE_KEY, consent);
  } catch {
    // Storage unavailable: the visitor will simply be asked again.
  }
}

export function readStoredEvents(): AnalyticsEvent[] {
  try {
    const raw = window.localStorage.getItem(EVENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      const result = AnalyticsEventSchema.safeParse(entry);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function appendStoredEvents(batch: AnalyticsEvent[]): void {
  if (batch.length === 0) return;
  try {
    const next = [...readStoredEvents(), ...batch].slice(-MAX_STORED_EVENTS);
    window.localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota or private mode: the batch is lost, which is acceptable for local metrics.
  }
}

export function clearStoredEvents(): void {
  try {
    window.localStorage.removeItem(EVENTS_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
