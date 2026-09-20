"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { DesktopWindow } from "@time-machine/content-schema";
import { effectiveBounds, type Viewport } from "@time-machine/window-manager";
import { getAppComponent } from "@/components/apps";
import type { AppProps } from "@/components/apps/types";
import { useDesktopStore } from "@/lib/desktopStore";

interface Props extends Pick<AppProps, "app" | "era" | "fs" | "clock" | "payload" | "openApp"> {
  win: DesktopWindow;
  viewport: Viewport;
  /** CSS scale applied to the desktop; pointer deltas are divided by it. */
  scale: number;
  active: boolean;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

const KEYBOARD_STEP = 8;

/**
 * Window chrome. Memoised: dragging one window re-renders only that window,
 * and every action comes straight from the store so props stay stable.
 */
export const Window = memo(function Window(props: Props) {
  const { win, viewport, scale, active, app, era, fs, clock, payload, openApp } = props;
  const focus = useDesktopStore((s) => s.focus);
  const close = useDesktopStore((s) => s.close);
  const minimize = useDesktopStore((s) => s.minimize);
  const toggleMaximize = useDesktopStore((s) => s.toggleMaximize);
  const move = useDesktopStore((s) => s.move);
  const resize = useDesktopStore((s) => s.resize);

  const sectionRef = useRef<HTMLElement>(null);
  const drag = useRef<DragState | null>(null);
  const resizing = useRef<DragState | null>(null);
  const bounds = effectiveBounds(win, viewport);
  const titleId = `${win.id}-title`;

  const closeSelf = useCallback(() => close(win.id), [close, win.id]);

  // Keyboard users land inside the window that just came to the front —
  // unless they are already working in it (a click on an input must win).
  useEffect(() => {
    const section = sectionRef.current;
    if (!active || !section || win.minimized) return;
    if (!section.contains(document.activeElement)) section.focus({ preventScroll: true });
  }, [active, win.minimized]);

  function onTitlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || win.maximized) return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: win.x,
      originY: win.y,
    };
  }

  function onTitlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    move(
      win.id,
      d.originX + (e.clientX - d.startX) / scale,
      d.originY + (e.clientY - d.startY) / scale,
    );
  }

  function onTitlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  }

  function onTitleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    // Ctrl/Alt chords belong to the desktop shortcuts, not to the title bar.
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const step = KEYBOARD_STEP;
    switch (e.key) {
      case "ArrowLeft":
        if (e.shiftKey) resize(win.id, win.width - step, win.height);
        else move(win.id, win.x - step, win.y);
        break;
      case "ArrowRight":
        if (e.shiftKey) resize(win.id, win.width + step, win.height);
        else move(win.id, win.x + step, win.y);
        break;
      case "ArrowUp":
        if (e.shiftKey) resize(win.id, win.width, win.height - step);
        else move(win.id, win.x, win.y - step);
        break;
      case "ArrowDown":
        if (e.shiftKey) resize(win.id, win.width, win.height + step);
        else move(win.id, win.x, win.y + step);
        break;
      case "Enter":
        toggleMaximize(win.id);
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  function onResizePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizing.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: win.width,
      originY: win.height,
    };
  }

  function onResizePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const r = resizing.current;
    if (!r || r.pointerId !== e.pointerId) return;
    resize(
      win.id,
      r.originX + (e.clientX - r.startX) / scale,
      r.originY + (e.clientY - r.startY) / scale,
    );
  }

  function onResizePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (resizing.current?.pointerId === e.pointerId) resizing.current = null;
  }

  const AppComponent = getAppComponent(win.appId);

  return (
    <section
      ref={sectionRef}
      className="tm-window tm-bevel"
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-testid="window"
      data-app-id={win.appId}
      data-window-id={win.id}
      data-active={active}
      hidden={win.minimized}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: win.zIndex,
      }}
      onPointerDownCapture={() => {
        if (!active) focus(win.id);
      }}
      onFocusCapture={() => {
        if (!active) focus(win.id);
      }}
    >
      <div
        className="tm-titlebar"
        data-testid="window-titlebar"
        tabIndex={0}
        title="Flèches : déplacer · Maj+flèches : redimensionner · Entrée : agrandir"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onPointerCancel={onTitlePointerUp}
        onDoubleClick={() => toggleMaximize(win.id)}
        onKeyDown={onTitleKeyDown}
      >
        <span aria-hidden>{app.icon}</span>
        <span id={titleId} className="flex-1 truncate">
          {win.title}
        </span>
        <button
          type="button"
          className="tm-btn tm-titlebar-btn"
          aria-label="Réduire"
          onClick={() => minimize(win.id)}
        >
          _
        </button>
        <button
          type="button"
          className="tm-btn tm-titlebar-btn"
          aria-label={win.maximized ? "Restaurer" : "Agrandir"}
          onClick={() => toggleMaximize(win.id)}
        >
          {win.maximized ? "❐" : "□"}
        </button>
        <button
          type="button"
          className="tm-btn tm-titlebar-btn ml-0.5"
          aria-label="Fermer"
          data-testid="window-close"
          onClick={closeSelf}
        >
          ✕
        </button>
      </div>
      <div className="tm-window-content">
        <AppComponent
          windowId={win.id}
          app={app}
          era={era}
          fs={fs}
          clock={clock}
          payload={payload}
          openApp={openApp}
          closeSelf={closeSelf}
        />
      </div>
      {!win.maximized && (
        <div
          className="tm-resize-handle"
          data-testid="window-resize"
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          onPointerCancel={onResizePointerUp}
        />
      )}
    </section>
  );
});
