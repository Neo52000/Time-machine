"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  builtinApps,
  createAppRegistry,
  resolveEraApps,
  type AppDefinition,
} from "@time-machine/apps-runtime";
import type { EraManifest } from "@time-machine/content-schema";
import {
  addTextFile,
  createEraClock,
  getBootSequence,
  getDesktopTheme,
  getFileSystem,
  matchShortcut,
  type VirtualFileSystem,
} from "@time-machine/desktop-engine";
import { orderedWindows, taskbarWindows } from "@time-machine/window-manager";
import { getAppComponent } from "@/components/apps";
import { useShallow } from "zustand/react/shallow";
import { useDesktopStore, type WindowPayload } from "@/lib/desktopStore";
import { AudioProvider, useAudio } from "@/lib/audio/AudioProvider";
import { useAnalytics } from "@/lib/analytics/AnalyticsProvider";
import {
  NarrativeProvider,
  useNarrative,
  type CreatedFile,
} from "@/lib/narrative/NarrativeProvider";
import { BootScreen } from "./BootScreen";
import { DesktopIcons } from "./DesktopIcons";
import { NarrativeToasts } from "./NarrativeToasts";
import { Taskbar } from "./Taskbar";
import { Window } from "./Window";
import "./desktop.css";

const registry = createAppRegistry(builtinApps);
/** Only the phone era downloads the phone shell and its apps. */
const PhoneScreen = dynamic(
  () => import("@/components/phone/PhoneScreen").then((m) => ({ default: m.PhoneScreen })),
  { ssr: false },
);
const EMPTY_PAYLOAD: WindowPayload = {};
const noop = () => undefined;
/** Height kept free above the phone for the stage tools (see .tm-stage-phone). */
const PHONE_TOOLS_PX = 40;
/** The phone's bezel, drawn outside its screen (box-shadow in phone.css). */
const PHONE_BEZEL_PX = 12;

/** Sound toggle and way out, for the full-screen shells (terminal, phone). */
function StageTools() {
  const audio = useAudio();
  const { track } = useAnalytics();
  return (
    <div className="tm-stage-tools">
      <button
        type="button"
        className="tm-stage-tool"
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
      <Link href="/" className="tm-stage-tool" data-testid="stage-exit">
        ← Timeline
      </Link>
    </div>
  );
}

/** Stable definitions for windows whose app id is unknown to the registry. */
const fallbackApps = new Map<string, AppDefinition>();
function appFor(win: { appId: string; title: string; width: number; height: number }) {
  const known = registry.get(win.appId);
  if (known) return known;
  let fallback = fallbackApps.get(win.appId);
  if (!fallback) {
    fallback = {
      id: win.appId,
      title: win.title,
      icon: "▪",
      defaultSize: { width: win.width, height: win.height },
      singleton: false,
    };
    fallbackApps.set(win.appId, fallback);
  }
  return fallback;
}

/**
 * The machine screen: rendered at the era's native resolution and scaled
 * down (never up) to fit the browser window, so window geometry is stable
 * across devices and the era's constraints stay visible.
 */
export function Desktop({ era }: { era: EraManifest }) {
  return (
    <AudioProvider machine={era.machine}>
      <NarrativeProvider key={era.id} eraId={era.id}>
        <DesktopStage era={era} />
      </NarrativeProvider>
    </AudioProvider>
  );
}

/** The seed disk plus whatever the story created; a bad path is reported, never fatal. */
function withCreatedFiles(fs: VirtualFileSystem, created: CreatedFile[]): VirtualFileSystem {
  return created.reduce((disk, file) => {
    try {
      return addTextFile(disk, file);
    } catch (error) {
      console.warn(`[narrative] ${(error as Error).message}`);
      return disk;
    }
  }, fs);
}

function DesktopStage({ era }: { era: EraManifest }) {
  const viewport = era.machine.resolution;
  const theme = useMemo(() => getDesktopTheme(era.machine.theme), [era.machine.theme]);
  const bootSequence = useMemo(
    () => getBootSequence(era.machine.bootSequence),
    [era.machine.bootSequence],
  );
  const baseFs = useMemo(() => getFileSystem(era.machine.id), [era.machine.id]);
  const { emit, createdFiles, wallpaper } = useNarrative();
  // A story reward can repaint the wallpaper; everything else stays the era theme.
  const tokens = useMemo(
    () => (wallpaper ? { ...theme.tokens, "--tm-desktop": wallpaper } : theme.tokens),
    [theme.tokens, wallpaper],
  );
  const fs = useMemo(() => withCreatedFiles(baseFs, createdFiles), [baseFs, createdFiles]);
  const { apps, missing } = useMemo(() => resolveEraApps(registry, era), [era]);
  const clock = useMemo(() => createEraClock(era.dateStart), [era.dateStart]);
  const audio = useAudio();
  const { track } = useAnalytics();

  const [booted, setBooted] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const wm = useDesktopStore((s) => s.wm);
  const payloads = useDesktopStore((s) => s.payloads);
  const startMenuOpen = useDesktopStore((s) => s.startMenuOpen);
  const actions = useDesktopStore(
    useShallow((s) => ({
      reset: s.reset,
      open: s.open,
      close: s.close,
      minimize: s.minimize,
      toggleMaximize: s.toggleMaximize,
      toggleFromTaskbar: s.toggleFromTaskbar,
      cycle: s.cycle,
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
    const maxScale = { terminal: 3, phone: 1.5, desktop: 1 }[theme.shell];
    // The phone stands below the stage tools, its bezel fully on screen.
    const phone = theme.shell === "phone";
    const reservedX = phone ? 2 * PHONE_BEZEL_PX : 0;
    const reservedY = phone ? PHONE_TOOLS_PX + 2 * PHONE_BEZEL_PX : 0;
    const fit = () => {
      const { width, height } = stage.getBoundingClientRect();
      setScale(
        Math.min(
          maxScale,
          (width - reservedX) / viewport.width,
          (height - reservedY) / viewport.height,
        ),
      );
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    return () => observer.disconnect();
    // `booted` matters: the stage only exists once the boot screen is gone.
  }, [viewport.width, viewport.height, booted, theme.shell]);

  // Window open/close sounds live here, not in the windows, so every path
  // (icons, start menu, shortcuts, closeSelf) sounds the same.
  const windowCount = wm.windows.length;
  const previousCount = useRef(windowCount);
  useEffect(() => {
    if (windowCount > previousCount.current) audio.play("window-open");
    else if (windowCount < previousCount.current) audio.play("window-close");
    previousCount.current = windowCount;
  }, [windowCount, audio]);

  // When the last window goes, keyboard focus must land somewhere useful.
  useEffect(() => {
    if (wm.activeWindowId === null && booted && document.activeElement === document.body) {
      rootRef.current?.focus({ preventScroll: true });
    }
  }, [wm.activeWindowId, booted]);

  useEffect(() => {
    if (!booted || theme.shell !== "desktop") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const command = matchShortcut(e);
      if (!command) return;
      e.preventDefault();
      const { wm: current, startMenuOpen: menuOpen } = useDesktopStore.getState();
      const active = current.activeWindowId;
      switch (command) {
        case "cycle-next":
          actions.cycle(1);
          break;
        case "cycle-prev":
          actions.cycle(-1);
          break;
        case "close-active":
          if (active) actions.close(active);
          break;
        case "minimize-active":
          if (active) actions.minimize(active);
          break;
        case "toggle-maximize-active":
          if (active) actions.toggleMaximize(active);
          break;
        case "toggle-start-menu":
          actions.setStartMenuOpen(!menuOpen);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [booted, theme.shell, actions]);

  const onBootDone = useCallback(
    (skipped: boolean) => {
      setBooted(true);
      audio.play("boot");
      track("boot.completed", { eraId: era.id, skipped });
      emit("era.loaded", { eraId: era.id });
    },
    [audio, track, emit, era.id],
  );

  const openApp = useCallback(
    (app: AppDefinition, payload?: WindowPayload) => {
      track("app.opened", { eraId: era.id, appId: app.id });
      return actions.open(app, payload);
    },
    [actions, track, era.id],
  );
  const openAppById = useCallback(
    (appId: string, payload?: WindowPayload) => {
      const app = apps.find((a) => a.id === appId) ?? registry.get(appId);
      if (app) openApp(app, payload);
    },
    [apps, openApp],
  );

  if (!booted) {
    return <BootScreen sequence={bootSequence} onDone={onBootDone} />;
  }

  // Phone shell: a home screen of icons, one app at a time.
  if (theme.shell === "phone") {
    return (
      <div ref={stageRef} className="tm-stage tm-stage-phone">
        <div
          className={`tm-desktop-root tm-style-${theme.windowStyle}`}
          data-testid="desktop"
          data-theme={theme.id}
          data-shell="phone"
          data-wallpaper={wallpaper ?? undefined}
          data-audio-enabled={audio.prefs.enabled}
          style={{
            width: viewport.width,
            height: viewport.height,
            transform: `scale(${scale})`,
            ...tokens,
          }}
        >
          <PhoneScreen era={era} clock={clock} apps={apps} />
          <NarrativeToasts limit={2} dismissAfterMs={5000} />
        </div>
        <StageTools />
      </div>
    );
  }

  // Terminal shell: no windows, the machine *is* its first application.
  if (theme.shell === "terminal") {
    const app = apps[0];
    const AppComponent = app ? getAppComponent(app.id) : undefined;
    return (
      <div ref={stageRef} className="tm-stage">
        <div
          className={`tm-desktop-root tm-style-${theme.windowStyle}${theme.crt ? " tm-crt" : ""}`}
          data-testid="desktop"
          data-theme={theme.id}
          data-shell="terminal"
          data-audio-enabled={audio.prefs.enabled}
          style={{
            width: viewport.width,
            height: viewport.height,
            transform: `scale(${scale})`,
            ...tokens,
          }}
        >
          {app && AppComponent ? (
            <AppComponent
              windowId="terminal"
              app={app}
              era={era}
              fs={fs}
              clock={clock}
              payload={EMPTY_PAYLOAD}
              openApp={openAppById}
              closeSelf={noop}
            />
          ) : (
            <p className="p-4 text-sm">Aucune application disponible pour cette machine.</p>
          )}
          <NarrativeToasts />
        </div>
        <StageTools />
      </div>
    );
  }

  return (
    <div ref={stageRef} className="tm-stage">
      <div
        ref={rootRef}
        className={`tm-desktop-root tm-style-${theme.windowStyle}${theme.crt ? " tm-crt" : ""}`}
        data-testid="desktop"
        data-theme={theme.id}
        data-wallpaper={wallpaper ?? undefined}
        data-audio-enabled={audio.prefs.enabled}
        style={{
          width: viewport.width,
          height: viewport.height,
          transform: `scale(${scale})`,
          ...tokens,
        }}
        onPointerDown={(e) => {
          // Clicking the wallpaper deselects everything (start menu handled by Taskbar).
          if (e.target === e.currentTarget) e.currentTarget.focus();
        }}
        tabIndex={-1}
      >
        <DesktopIcons apps={apps} onOpen={openApp} />

        {orderedWindows(wm).map((win) => (
          <Window
            key={win.id}
            win={win}
            viewport={viewport}
            scale={scale}
            active={wm.activeWindowId === win.id}
            app={appFor(win)}
            era={era}
            fs={fs}
            clock={clock}
            payload={payloads[win.id] ?? EMPTY_PAYLOAD}
            openApp={openAppById}
          />
        ))}

        <Taskbar
          era={era}
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

        <NarrativeToasts />
      </div>
    </div>
  );
}
