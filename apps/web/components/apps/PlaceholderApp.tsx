"use client";

import type { AppProps } from "./types";

const PHASE_BY_APP: Record<string, string> = {};

export function PlaceholderApp({ app, era }: AppProps) {
  const phase = PHASE_BY_APP[app.id];
  return (
    <div className="tm-app-body h-full p-4 text-sm" data-testid={`placeholder-${app.id}`}>
      <p className="font-bold">{app.title}</p>
      <p className="mt-2">
        Cette application n&apos;est pas encore disponible dans l&apos;époque {era.label}.
      </p>
      {phase && <p className="mt-1 text-[var(--tm-text-muted)]">Prévue : {phase}.</p>}
    </div>
  );
}
