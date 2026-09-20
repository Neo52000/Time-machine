"use client";

import { useEffect, useState } from "react";
import type { AnalyticsEvent } from "@time-machine/content-schema";
import { summarize, type ConsentState } from "@time-machine/analytics-engine";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { clearStoredEvents, readStoredEvents } from "@/lib/analytics/storage";

const CONSENT_LABEL: Record<ConsentState, string> = {
  unknown: "non demandé",
  granted: "accordé",
  denied: "refusé",
};

/** Reads the local sink — the only collector today — so the owner can see what is measured. */
export function AnalyticsPanel() {
  const { consent, setConsent } = useAnalytics();
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    setEvents(readStoredEvents());
  }, [consent]);

  const counts = summarize(events);
  const names = Object.keys(counts).sort();

  return (
    <section data-testid="admin-analytics">
      <p className="mb-4 max-w-2xl text-neutral-400">
        Événements produit conservés dans ce navigateur (aucun envoi). Consentement :{" "}
        <strong className="text-neutral-200" data-testid="analytics-consent">
          {CONSENT_LABEL[consent]}
        </strong>
        .
      </p>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded bg-neutral-800 px-3 py-1.5 text-neutral-200 hover:bg-neutral-700"
          onClick={() => setEvents(readStoredEvents())}
          data-testid="analytics-refresh"
        >
          Rafraîchir
        </button>
        <button
          type="button"
          className="rounded bg-neutral-800 px-3 py-1.5 text-neutral-200 hover:bg-neutral-700"
          onClick={() => setConsent(consent === "granted" ? "denied" : "granted")}
          data-testid="analytics-toggle-consent"
        >
          {consent === "granted" ? "Retirer le consentement" : "Accorder le consentement"}
        </button>
        <button
          type="button"
          className="rounded bg-red-900 px-3 py-1.5 text-red-200 hover:bg-red-800"
          onClick={() => {
            clearStoredEvents();
            setEvents([]);
          }}
          data-testid="analytics-clear"
        >
          Effacer
        </button>
      </div>

      {names.length === 0 ? (
        <p className="text-neutral-500" data-testid="analytics-empty">
          Aucun événement enregistré.
        </p>
      ) : (
        <>
          <table className="mb-6 w-full max-w-md border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-700 text-neutral-400">
                <th className="py-1 pr-4">Événement</th>
                <th className="py-1">Occurrences</th>
              </tr>
            </thead>
            <tbody>
              {names.map((name) => (
                <tr
                  key={name}
                  className="border-b border-neutral-800"
                  data-testid={`analytics-count-${name}`}
                >
                  <td className="py-1 pr-4 text-neutral-200">{name}</td>
                  <td className="py-1">{counts[name]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ol className="space-y-1 text-xs text-neutral-400" aria-label="Derniers événements">
            {events
              .slice(-30)
              .reverse()
              .map((event, index) => (
                <li key={`${event.at}-${index}`}>
                  <span className="text-neutral-500">
                    {new Date(event.at).toLocaleTimeString("fr-FR")}
                  </span>{" "}
                  <span className="text-neutral-200">{event.name}</span>{" "}
                  {JSON.stringify(event.props)}
                </li>
              ))}
          </ol>
        </>
      )}
    </section>
  );
}
