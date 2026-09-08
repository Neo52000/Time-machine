"use client";

import { useState } from "react";
import type { AppDefinition } from "@time-machine/apps-runtime";

interface Props {
  apps: AppDefinition[];
  onOpen: (app: AppDefinition) => void;
}

/** Desktop icons: single click selects, double click / Enter opens. */
export function DesktopIcons({ apps, onOpen }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="absolute left-2 top-2 flex flex-col flex-wrap gap-2" data-testid="app-list">
      {apps.map((app) => (
        <button
          key={app.id}
          type="button"
          className="tm-icon"
          data-testid={`app-${app.id}`}
          data-selected={selected === app.id}
          onClick={() => setSelected(app.id)}
          onDoubleClick={() => onOpen(app)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(app);
            }
          }}
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
