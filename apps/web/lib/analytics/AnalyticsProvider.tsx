"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AnalyticsEventName, AnalyticsProps } from "@time-machine/content-schema";
import {
  createAnalyticsState,
  createSessionId,
  flush,
  record,
  setConsent as applyConsent,
  type AnalyticsState,
  type ConsentState,
} from "@time-machine/analytics-engine";
import { appendStoredEvents, readConsent, writeConsent } from "./storage";

const FLUSH_INTERVAL_MS = 3000;

interface AnalyticsApi {
  consent: ConsentState;
  setConsent: (consent: ConsentState) => void;
  track: (name: AnalyticsEventName, props?: AnalyticsProps) => void;
}

const AnalyticsContext = createContext<AnalyticsApi>({
  consent: "unknown",
  setConsent: () => undefined,
  track: () => undefined,
});

export function useAnalytics(): AnalyticsApi {
  return useContext(AnalyticsContext);
}

/**
 * Owns the analytics engine state, the consent answer and the only sink:
 * a local ring buffer in this browser (see `storage.ts`) — nothing leaves
 * the machine. Swapping the sink for a real collector is a one-line change
 * in `drain` once there is a backend to send to.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const stateRef = useRef<AnalyticsState>(createAnalyticsState({ sessionId: createSessionId() }));
  const [consent, setConsentState] = useState<ConsentState>("unknown");

  const drain = useCallback(() => {
    const { state, batch } = flush(stateRef.current);
    stateRef.current = state;
    if (batch.length > 0) {
      appendStoredEvents(batch);
      if (process.env.NODE_ENV !== "production") {
        console.debug("[analytics]", batch);
      }
    }
  }, []);

  useEffect(() => {
    const stored = readConsent();
    stateRef.current = applyConsent(stateRef.current, stored);
    setConsentState(stored);
  }, []);

  useEffect(() => {
    const id = window.setInterval(drain, FLUSH_INTERVAL_MS);
    window.addEventListener("pagehide", drain);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("pagehide", drain);
      drain();
    };
  }, [drain]);

  const setConsent = useCallback(
    (next: ConsentState) => {
      stateRef.current = applyConsent(stateRef.current, next);
      writeConsent(next);
      setConsentState(next);
      drain();
    },
    [drain],
  );

  const track = useCallback((name: AnalyticsEventName, props: AnalyticsProps = {}) => {
    stateRef.current = record(stateRef.current, name, props, Date.now());
  }, []);

  const api = useMemo<AnalyticsApi>(
    () => ({ consent, setConsent, track }),
    [consent, setConsent, track],
  );

  return <AnalyticsContext.Provider value={api}>{children}</AnalyticsContext.Provider>;
}
