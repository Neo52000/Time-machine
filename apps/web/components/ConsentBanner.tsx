"use client";

import { usePathname } from "next/navigation";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";

/**
 * Asked once, on the entry page only, so it never overlaps a machine's
 * screen. Metrics stay in this browser (no collector yet), which is what
 * the wording promises.
 */
export function ConsentBanner() {
  const { consent, setConsent } = useAnalytics();
  const pathname = usePathname();
  if (consent !== "unknown" || pathname !== "/") return null;

  return (
    <aside
      className="fixed right-4 top-4 z-50 max-w-xs rounded border border-neutral-700 bg-neutral-900 p-3 text-xs text-neutral-300 shadow-lg"
      role="region"
      aria-label="Mesure d'audience"
      data-testid="consent-banner"
    >
      <p className="mb-2">
        Mesure d&apos;audience anonyme, conservée uniquement dans ce navigateur — rien n&apos;est
        envoyé.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded bg-white px-2 py-1 font-semibold text-black"
          onClick={() => setConsent("granted")}
          data-testid="consent-accept"
        >
          Accepter
        </button>
        <button
          type="button"
          className="rounded border border-neutral-600 px-2 py-1"
          onClick={() => setConsent("denied")}
          data-testid="consent-decline"
        >
          Refuser
        </button>
      </div>
    </aside>
  );
}
