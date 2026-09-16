"use client";

import { useState, type KeyboardEvent } from "react";
import type { AppDefinition } from "@time-machine/apps-runtime";

interface Props {
  apps: AppDefinition[];
  onOpen: (app: AppDefinition) => void;
}

/** Desktop icons: single click selects, double click / Enter opens, arrows move between icons. */
export function DesktopIcons({ apps, onOpen }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, app: AppDefinition) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(app);
      return;
    }
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const buttons = Array.from(
      e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(".tm-icon") ?? [],
    );
    const index = buttons.indexOf(e.currentTarget);
    const next = buttons[(index + step + buttons.length) % buttons.length];
    next?.focus();
    const nextApp = apps[buttons.indexOf(next!)];
    if (nextApp) setSelected(nextApp.id);
  }

  return (
    <div
      className="absolute left-2 top-2 flex flex-col flex-wrap gap-2"
      data-testid="app-list"
      role="group"
      aria-label="Applications"
    >
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className="tm-icon"
          data-testid={`app-${app.id}`}
          data-selected={selected === app.id}
          onClick={() => setSelected(app.id)}
          onFocus={() => setSelected(app.id)}
          onDoubleClick={() => onOpen(app)}
          onKeyDown={(e) => onKeyDown(e, app)}
        >
          <span className="tm-icon-glyph" aria-hidden>
            {app.icon}
          </span>
          <span className="tm-icon-label px-1">{app.title}</span>
        </button>
      ))}
    </div>
  );
}
