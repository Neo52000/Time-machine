"use client";

import { useState } from "react";
import { encodePassport, passportProgress, narrativeCatalog } from "@time-machine/narrative-engine";
import type { EraManifest } from "@time-machine/content-schema";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import { usePassport } from "@/lib/narrative/passport";

/**
 * The visitor's passport: stamps earned while exploring each machine, kept
 * in this browser only. Missing stamps show their hint — a to-do list for
 * the curious, never a historical claim.
 */
export function Passport({ eras }: { eras: EraManifest[] }) {
  const passport = usePassport();
  const progress = passportProgress(narrativeCatalog.stamps, passport);
  const total = narrativeCatalog.stamps.length;
  const earned = Object.keys(passport).length;
  const labelOf = (eraId: string) => eras.find((e) => e.id === eraId)?.label ?? eraId;

  return (
    <section
      className="w-full max-w-2xl border border-neutral-800 p-4"
      aria-labelledby="passport-title"
      data-testid="passport"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="passport-title" className="text-sm uppercase tracking-widest text-neutral-300">
          Passeport du voyageur
        </h2>
        <span className="text-xs text-neutral-500" data-testid="passport-count">
          {earned} / {total} tampons
        </span>
      </div>
      {earned > 0 && <SharePassport code={encodePassport(narrativeCatalog.stamps, passport)} />}
      <div
        className="mt-2 h-1 w-full bg-neutral-800"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={earned}
        aria-label="Tampons obtenus"
      >
        <div className="h-full bg-amber-400" style={{ width: `${(earned / total) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-3">
        {progress.map((era) => (
          <li key={era.eraId}>
            <p className="text-xs text-neutral-400">
              {labelOf(era.eraId)}{" "}
              <span className="text-neutral-600">
                {era.earned.length}/{era.earned.length + era.missing.length}
              </span>
            </p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {[...era.earned, ...era.missing].map((stamp) => {
                const has = stamp.id in passport;
                return (
                  <li
                    key={stamp.id}
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg ${
                      has
                        ? "border-amber-400 bg-amber-400/10"
                        : "border-dashed border-neutral-700 text-neutral-700 grayscale"
                    }`}
                    title={has ? `${stamp.title} — ${stamp.hint}` : `À trouver : ${stamp.hint}`}
                    aria-label={
                      has ? `${stamp.title} (obtenu)` : `Tampon à trouver : ${stamp.hint}`
                    }
                    data-testid={`passport-stamp-${stamp.id}`}
                    data-earned={has}
                  >
                    <span aria-hidden>{has ? stamp.icon : "?"}</span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Shares the passport as a link (native share sheet when there is one,
 * clipboard otherwise). The link holds stamp ids only — see `encodePassport`.
 */
function SharePassport({ code }: { code: string }) {
  const { track } = useAnalytics();
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const stamps = code.split(".").length;

  async function share() {
    const url = `${window.location.origin}/passport/${code}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Mon passeport Time Machine", url });
        track("passport.shared", { stamps, method: "native" });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      track("passport.shared", { stamps, method: "clipboard" });
    } catch (error) {
      // Closing the share sheet is not a failure worth reporting.
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("failed");
    }
  }

  return (
    <div className="mt-2 flex items-center gap-3 text-xs">
      <button
        type="button"
        onClick={share}
        className="border border-amber-700 px-2 py-1 text-amber-300 hover:border-amber-400"
        data-testid="passport-share"
      >
        Partager mon passeport
      </button>
      <span role="status" className="text-neutral-500" data-testid="passport-share-status">
        {status === "copied" && "Lien copié."}
        {status === "failed" && (
          <a href={`/passport/${code}`} className="underline">
            Ouvrir le lien à partager
          </a>
        )}
      </span>
    </div>
  );
}

/** "2/4 tampons" for one era, for the timeline's era stations. */
export function EraStampCount({ eraId }: { eraId: string }) {
  const passport = usePassport();
  const stamps = narrativeCatalog.stamps.filter((s) => s.eraId === eraId);
  if (stamps.length === 0) return null;
  const earned = stamps.filter((s) => s.id in passport).length;
  return (
    <span className="text-xs text-amber-400/80" data-testid={`era-stamps-${eraId}`}>
      🏅 {earned}/{stamps.length} tampons
    </span>
  );
}
