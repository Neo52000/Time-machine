"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { AppDefinition } from "@time-machine/apps-runtime";
import type { DesktopWindow } from "@time-machine/content-schema";
import {
  eraNow,
  formatEraDate,
  formatEraTime,
  shortcutLabels,
  type DesktopCommand,
  type DesktopTheme,
  type EraClock,
} from "@time-machine/desktop-engine";
import { TASKBAR_HEIGHT } from "@time-machine/window-manager";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";

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

const COMMAND_LABELS: Record<DesktopCommand, string> = {
  "cycle-next": "fenêtre suivante",
  "cycle-prev": "fenêtre précédente",
  "close-active": "fermer",
  "minimize-active": "réduire",
  "toggle-maximize-active": "agrandir",
  "toggle-start-menu": "menu",
};

const SHORTCUT_HINT = shortcutLabels()
  .filter((s) => s.command !== "cycle-prev")
  .map((s) => `${s.label} ${COMMAND_LABELS[s.command]}`)
  .join(" · ");

function menuItems(menu: HTMLElement | null): HTMLElement[] {
  return Array.from(menu?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
}

export function Taskbar(props: Props) {
  const { theme, clock, apps, windows, activeWindowId, startMenuOpen, onCloseStartMenu } = props;
  const [now, setNow] = useState(() => eraNow(clock));
  const menuRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const audio = useAudio();
  const { track } = useAnalytics();

  useEffect(() => {
    const id = setInterval(() => setNow(eraNow(clock)), 1000);
    return () => clearInterval(id);
  }, [clock]);

  useEffect(() => {
    if (!startMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onCloseStartMenu();
    };
    const onKey = (e: KeyboardEvent | globalThis.KeyboardEvent) =>
      e.key === "Escape" && onCloseStartMenu();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [startMenuOpen, onCloseStartMenu]);

  // Menu semantics: focus enters the first item on open and returns to the
  // Start button on close, unless something else (a new window) took it.
  useEffect(() => {
    if (startMenuOpen) {
      wasOpen.current = true;
      menuItems(menuRef.current)[0]?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      if (document.activeElement === document.body) startRef.current?.focus();
    }
  }, [startMenuOpen]);

  function onMenuKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const items = menuItems(e.currentTarget);
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number | undefined;
    if (e.key === "ArrowDown") next = (index + 1) % items.length;
    else if (e.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next === undefined) return;
    e.preventDefault();
    items[next]?.focus();
  }

  const iconOf = (appId: string) => apps.find((a) => a.id === appId)?.icon ?? "▪";

  return (
    <div
      className="tm-taskbar tm-bevel"
      style={{ height: TASKBAR_HEIGHT }}
      data-testid="taskbar"
      role="toolbar"
      aria-label="Barre des tâches"
    >
      <div ref={menuRef} className="relative">
        <button
          ref={startRef}
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
          <div
            className="tm-start-menu tm-bevel"
            role="menu"
            aria-label={theme.startLabel}
            data-testid="start-menu"
            onKeyDown={onMenuKeyDown}
          >
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
            <div className="tm-start-menu-hint" data-testid="start-shortcuts">
              {SHORTCUT_HINT}
            </div>
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

      <div className="tm-tray text-xs">
        <button
          type="button"
          className="tm-tray-btn"
          aria-pressed={audio.prefs.enabled}
          aria-label={audio.prefs.enabled ? "Couper le son" : "Activer le son"}
          data-testid="audio-toggle"
          onClick={() => {
            audio.toggle();
            track("audio.toggled", { enabled: !audio.prefs.enabled });
          }}
        >
          {audio.prefs.enabled ? "🔊" : "🔇"}
        </button>
        <span
          data-testid="era-clock"
          title={formatEraDate(now)}
          aria-label={`Horloge — ${formatEraDate(now)} ${formatEraTime(now)}`}
        >
          {formatEraTime(now)}
        </span>
      </div>
    </div>
  );
}
