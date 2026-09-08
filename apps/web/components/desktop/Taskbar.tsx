"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AppDefinition } from "@time-machine/apps-runtime";
import type { DesktopWindow } from "@time-machine/content-schema";
import {
  eraNow,
  formatEraDate,
  formatEraTime,
  type DesktopTheme,
  type EraClock,
} from "@time-machine/desktop-engine";
import { TASKBAR_HEIGHT } from "@time-machine/window-manager";

interface Props {
  theme: DesktopTheme;
  clock: EraClock;
  apps: AppDefinition[];
  windows: DesktopWindow[];
  activeWindowId: string | null;
  startMenuOpen: boolean;
  onToggleStartMenu: () => void;
  onCloseStartMenu: () => void;
  onOpenApp: (app: AppDefinition) => void;
  onToggleWindow: (id: string) => void;
}

export function Taskbar(props: Props) {
  const { theme, clock, apps, windows, activeWindowId, startMenuOpen, onCloseStartMenu } = props;
  const [now, setNow] = useState(() => eraNow(clock));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(eraNow(clock)), 1000);
    return () => clearInterval(id);
  }, [clock]);

  useEffect(() => {
    if (!startMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onCloseStartMenu();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseStartMenu();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [startMenuOpen, onCloseStartMenu]);

  const iconOf = (appId: string) => apps.find((a) => a.id === appId)?.icon ?? "▪";

  return (
    <div className="tm-taskbar tm-bevel" style={{ height: TASKBAR_HEIGHT }} data-testid="taskbar">
      <div ref={menuRef} className="relative">
        <button
          type="button"
          className="tm-btn font-bold"
          aria-pressed={startMenuOpen}
          aria-haspopup="menu"
          aria-expanded={startMenuOpen}
          data-testid="start-button"
          onClick={props.onToggleStartMenu}
        >
          ⊞ {theme.startLabel}
        </button>
        {startMenuOpen && (
          <div className="tm-start-menu tm-bevel" role="menu" data-testid="start-menu">
            <div
              className="mb-1 px-2 py-1 text-xs font-bold"
              style={{
                background: "var(--tm-title-active-from)",
                color: "var(--tm-title-text)",
              }}
            >
              {theme.name}
            </div>
            {apps.map((app) => (
              <button
                key={app.id}
                type="button"
                role="menuitem"
                className="tm-start-menu-item"
                data-testid={`start-app-${app.id}`}
                onClick={() => props.onOpenApp(app)}
              >
                <span aria-hidden>{app.icon}</span>
                {app.title}
              </button>
            ))}
            <div className="my-1 border-t" style={{ borderColor: "var(--tm-surface-dark)" }} />
            <Link
              href="/"
              role="menuitem"
              className="tm-start-menu-item"
              data-testid="start-shutdown"
            >
              <span aria-hidden>⏻</span>
              Arrêter — retour à la timeline
            </Link>
          </div>
        )}
      </div>

      <div className="mx-1 h-5 w-px" style={{ background: "var(--tm-surface-dark)" }} />

      <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
        {windows.map((w) => (
          <button
            key={w.id}
            type="button"
            className="tm-btn tm-task-btn"
            aria-pressed={w.id === activeWindowId && !w.minimized}
            data-testid={`task-${w.appId}`}
            onClick={() => props.onToggleWindow(w.id)}
          >
            <span aria-hidden>{iconOf(w.appId)}</span> {w.title}
          </button>
        ))}
      </div>

      <div className="tm-tray text-xs" data-testid="era-clock" title={formatEraDate(now)}>
        {formatEraTime(now)}
      </div>
    </div>
  );
}
