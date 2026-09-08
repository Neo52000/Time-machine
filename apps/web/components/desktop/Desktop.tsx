"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  builtinApps,
  createAppRegistry,
  resolveEraApps,
  type AppDefinition,
} from "@time-machine/apps-runtime";
import type { EraManifest } from "@time-machine/content-schema";
import {
  createEraClock,
  getBootSequence,
  getDesktopTheme,
  getFileSystem,
} from "@time-machine/desktop-engine";
import { orderedWindows, taskbarWindows } from "@time-machine/window-manager";
import { getAppComponent } from "@/components/apps";
import { useShallow } from "zustand/react/shallow";
import { useDesktopStore, type WindowPayload } from "@/lib/desktopStore";
import { BootScreen } from "./BootScreen";
import { DesktopIcons } from "./DesktopIcons";
import { Taskbar } from "./Taskbar";
import { Window } from "./Window";
import "./desktop.css";

const registry = createAppRegistry(builtinApps);

/**
 * The machine screen: rendered at the era's native resolution and scaled
 * down (never up) to fit the browser window, so window geometry is stable
 * across devices and the era's constraints stay visible.
 */
export function Desktop({ era }: { era: EraManifest }) {
  const viewport = era.machine.resolution;
  const theme = useMemo(() => getDesktopTheme(era.machine.theme), [era.machine.theme]);
  const bootSequence = useMemo(
    () => getBootSequence(era.machine.bootSequence),
    [era.machine.bootSequence],
  );
  const fs = useMemo(() => getFileSystem(era.machine.id), [era.machine.id]);
  const { apps, missing } = useMemo(() => resolveEraApps(registry, era), [era]);
  const clock = useMemo(() => createEraClock(era.dateStart), [era.dateStart]);

  const [booted, setBooted] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);

  const wm = useDesktopStore((s) => s.wm);
  const payloads = useDesktopStore((s) => s.payloads);
  const startMenuOpen = useDesktopStore((s) => s.startMenuOpen);
  const actions = useDesktopStore(
    useShallow((s) => ({
      reset: s.reset,
      open: s.open,
      close: s.close,
      focus: s.focus,
      minimize: s.minimize,
      toggleMaximize: s.toggleMaximize,
      toggleFromTaskbar: s.toggleFromTaskbar,
      move: s.move,
      resize: s.resize,
      setStartMenuOpen: s.setStartMenuOpen,
    })),
  );

  useEffect(() => {
    actions.reset(viewport);
  }, [actions, viewport, era.id]);

  useEffect(() => {
    if (missing.length > 0) {
      console.warn(`[desktop] era "${era.id}" requests unknown apps: ${missing.join(", ")}`);
    }
  }, [era.id, missing]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const { width, height } = stage.getBoundingClientRect();
      setScale(Math.min(1, width / viewport.width, height / viewport.height));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
    // `booted` matters: the stage only exists once the boot screen is gone.
  }, [viewport.width, viewport.height, booted]);

  const onBootDone = useCallback(() => setBooted(true), []);

  const openApp = useCallback(
    (app: AppDefinition, payload?: WindowPayload) => actions.open(app, payload),
    [actions],
  );
  const openAppById = useCallback(
    (appId: string, payload?: WindowPayload) => {
      const app = apps.find((a) => a.id === appId) ?? registry.get(appId);
      if (app) actions.open(app, payload);
    },
    [actions, apps],
  );

  if (!booted) {
    return <BootScreen sequence={bootSequence} onDone={onBootDone} />;
  }

  return (
    <div ref={stageRef} className="tm-stage">
      <div
        className={`tm-desktop-root tm-style-${theme.windowStyle}${theme.crt ? " tm-crt" : ""}`}
        data-testid="desktop"
        data-theme={theme.id}
        style={{
          width: viewport.width,
          height: viewport.height,
          transform: `scale(${scale})`,
          ...theme.tokens,
        }}
        onPointerDown={(e) => {
          // Clicking the wallpaper deselects everything (start menu handled by Taskbar).
          if (e.target === e.currentTarget) e.currentTarget.focus();
        }}
        tabIndex={-1}
      >
        <DesktopIcons apps={apps} onOpen={openApp} />

        {orderedWindows(wm).map((win) => {
          const app = registry.get(win.appId) ?? {
            id: win.appId,
            title: win.title,
            icon: "▪",
            defaultSize: { width: win.width, height: win.height },
            singleton: false,
          };
          const AppComponent = getAppComponent(win.appId);
          return (
            <Window
              key={win.id}
              window={win}
              viewport={viewport}
              scale={scale}
              active={wm.activeWindowId === win.id}
              icon={app.icon}
              onFocus={() => actions.focus(win.id)}
              onClose={() => actions.close(win.id)}
              onMinimize={() => actions.minimize(win.id)}
              onToggleMaximize={() => actions.toggleMaximize(win.id)}
              onMove={(x, y) => actions.move(win.id, x, y)}
              onResize={(w, h) => actions.resize(win.id, w, h)}
            >
              <AppComponent
                windowId={win.id}
                app={app}
                era={era}
                fs={fs}
                clock={clock}
                payload={payloads[win.id] ?? {}}
                openApp={openAppById}
                closeSelf={() => actions.close(win.id)}
              />
            </Window>
          );
        })}

        <Taskbar
          theme={theme}
          clock={clock}
          apps={apps}
          windows={taskbarWindows(wm)}
          activeWindowId={wm.activeWindowId}
          startMenuOpen={startMenuOpen}
          onToggleStartMenu={() => actions.setStartMenuOpen(!startMenuOpen)}
          onCloseStartMenu={() => actions.setStartMenuOpen(false)}
          onOpenApp={openApp}
          onToggleWindow={actions.toggleFromTaskbar}
        />
      </div>
    </div>
  );
}
