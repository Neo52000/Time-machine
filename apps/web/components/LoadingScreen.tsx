"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { EraManifest } from "@time-machine/content-schema";

const LOADING_DURATION_MS = 1800;

export function LoadingScreen({ era }: { era: EraManifest }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/era/${era.id}/desktop`);
    }, LOADING_DURATION_MS);
    return () => clearTimeout(timer);
  }, [era.id, router]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black font-mono text-green-400"
      data-testid="loading-screen"
    >
      <p className="animate-pulse text-xl tracking-widest">LOADING {era.label.toUpperCase()}...</p>
      <div className="h-1 w-64 overflow-hidden bg-neutral-800">
        <div className="loading-bar h-full bg-green-400" />
      </div>
    </main>
  );
}
