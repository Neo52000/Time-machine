"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import type { DesktopWindow } from "@time-machine/content-schema";
import { effectiveBounds, type Viewport } from "@time-machine/window-manager";

interface Props {
  window: DesktopWindow;
  viewport: Viewport;
  /** CSS scale applied to the desktop; pointer deltas are divided by it. */
  scale: number;
  active: boolean;
  icon: string;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  children: ReactNode;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export function Window(props: Props) {
  const { window: win, viewport, scale, active, icon } = props;
  const drag = useRef<DragState | null>(null);
  const resize = useRef<DragState | null>(null);
  const bounds = effectiveBounds(win, viewport);

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
    props.onMove(
      d.originX + (e.clientX - d.startX) / scale,
      d.originY + (e.clientY - d.startY) / scale,
    );
  }

  function onTitlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  }

  function onResizePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resize.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: win.width,
      originY: win.height,
    };
  }

  function onResizePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const r = resize.current;
    if (!r || r.pointerId !== e.pointerId) return;
    props.onResize(
      r.originX + (e.clientX - r.startX) / scale,
      r.originY + (e.clientY - r.startY) / scale,
    );
  }

  function onResizePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (resize.current?.pointerId === e.pointerId) resize.current = null;
  }

  return (
    <section
      className="tm-window tm-bevel"
      data-testid="window"
      data-app-id={win.appId}
      data-window-id={win.id}
      data-active={active}
      aria-label={win.title}
      hidden={win.minimized}
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
        zIndex: win.zIndex,
      }}
      onPointerDownCapture={() => {
        if (!active) props.onFocus();
      }}
    >
      <div
        className="tm-titlebar"
        data-testid="window-titlebar"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onPointerCancel={onTitlePointerUp}
        onDoubleClick={props.onToggleMaximize}
      >
        <span aria-hidden>{icon}</span>
        <span className="flex-1 truncate">{win.title}</span>
        <button
          type="button"
          className="tm-btn tm-titlebar-btn"
          aria-label="Réduire"
          onClick={props.onMinimize}
        >
          _
        </button>
        <button
          type="button"
          className="tm-btn tm-titlebar-btn"
          aria-label={win.maximized ? "Restaurer" : "Agrandir"}
          onClick={props.onToggleMaximize}
        >
          {win.maximized ? "❐" : "□"}
        </button>
        <button
          type="button"
          className="tm-btn tm-titlebar-btn ml-0.5"
          aria-label="Fermer"
          data-testid="window-close"
          onClick={props.onClose}
        >
          ✕
        </button>
      </div>
      <div className="tm-window-content">{props.children}</div>
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
}
