"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EraManifest } from "@time-machine/content-schema";
import { useReducedMotion } from "@/lib/useReducedMotion";

const LOADING_DURATION_MS = 1800;
/** With reduced motion the progress bar is static, so there is nothing to wait for. */
const REDUCED_DURATION_MS = 400;

export function LoadingScreen({ era }: { era: EraManifest }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(
      () => router.push(`/era/${era.id}/desktop`),
      reducedMotion ? REDUCED_DURATION_MS : LOADING_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [era.id, router, reducedMotion]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black font-mono text-green-400"
      data-testid="loading-screen"
      data-reduced-motion={reducedMotion}
      aria-live="polite"
    >
      <p className={`text-xl tracking-widest${reducedMotion ? "" : " animate-pulse"}`}>
        LOADING {era.label.toUpperCase()}...
      </p>
      <div className="h-1 w-64 overflow-hidden bg-neutral-800" aria-hidden>
        <div className="loading-bar h-full bg-green-400" />
      </div>
    </main>
  );
}
