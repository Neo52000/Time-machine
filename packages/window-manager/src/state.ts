import type { DesktopWindow } from "@time-machine/content-schema";

/**
 * Window Manager — pure, framework-agnostic state transitions.
 *
 * Every function takes a `WindowManagerState` and returns a new one (no
 * mutation), so the same logic can back a Zustand store in the web app and
 * be unit-tested in isolation. Nothing here knows about React or the DOM.
 */

export interface Viewport {
  width: number;
  height: number;
}

export interface WindowManagerState {
  viewport: Viewport;
  windows: DesktopWindow[];
  /** Id of the focused (topmost, non-minimized) window, if any. */
  activeWindowId: string | null;
  /** Monotonic counter used to hand out z-indexes and window ids. */
  nextZIndex: number;
  nextWindowSeq: number;
}

export interface OpenWindowOptions {
  appId: string;
  title: string;
  width: number;
  height: number;
  /** Explicit position; otherwise the window is cascaded. */
  x?: number;
  y?: number;
  /** Only one window per app: focus the existing one instead of opening another. */
  singleton?: boolean;
}

/** Height reserved at the bottom of the viewport (taskbar). */
export const TASKBAR_HEIGHT = 28;
/** Height of a window title bar; windows can never be dragged above the top edge. */
export const TITLE_BAR_HEIGHT = 20;
/** Minimum part of a window that must stay visible when moved off-screen. */
const MIN_VISIBLE = 40;

const CASCADE_STEP = 24;
// Starts right of the desktop icon column so icons stay clickable under one window.
const CASCADE_ORIGIN = { x: 96, y: 24 };

export const MIN_WINDOW_WIDTH = 160;
export const MIN_WINDOW_HEIGHT = 100;

export function createWindowManagerState(viewport: Viewport): WindowManagerState {
  return {
    viewport,
    windows: [],
    activeWindowId: null,
    nextZIndex: 1,
    nextWindowSeq: 1,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Keep a window reachable: its title bar must stay inside the usable area. */
export function clampPosition(
  x: number,
  y: number,
  width: number,
  _height: number,
  viewport: Viewport,
): { x: number; y: number } {
  const usableHeight = viewport.height - TASKBAR_HEIGHT;
  return {
    x: clamp(x, MIN_VISIBLE - width, viewport.width - MIN_VISIBLE),
    y: clamp(y, 0, usableHeight - TITLE_BAR_HEIGHT),
  };
}

export function clampSize(
  width: number,
  height: number,
  viewport: Viewport,
): { width: number; height: number } {
  return {
    width: clamp(width, MIN_WINDOW_WIDTH, viewport.width),
    height: clamp(height, MIN_WINDOW_HEIGHT, viewport.height - TASKBAR_HEIGHT),
  };
}

function cascadePosition(state: WindowManagerState, width: number, height: number) {
  const openCount = state.windows.filter((w) => !w.minimized).length;
  const raw = {
    x: CASCADE_ORIGIN.x + openCount * CASCADE_STEP,
    y: CASCADE_ORIGIN.y + openCount * CASCADE_STEP,
  };
  const usableHeight = state.viewport.height - TASKBAR_HEIGHT;
  // Restart the cascade once it would push the window past the bottom/right edge.
  if (raw.x + width > state.viewport.width || raw.y + height > usableHeight) {
    return { ...CASCADE_ORIGIN };
  }
  return raw;
}

function withUpdatedWindow(
  state: WindowManagerState,
  id: string,
  update: (window: DesktopWindow) => DesktopWindow,
): WindowManagerState {
  let changed = false;
  const windows = state.windows.map((w) => {
    if (w.id !== id) return w;
    changed = true;
    return update(w);
  });
  return changed ? { ...state, windows } : state;
}

function topmostVisible(windows: DesktopWindow[]): DesktopWindow | undefined {
  return windows
    .filter((w) => !w.minimized)
    .reduce<DesktopWindow | undefined>(
      (top, w) => (top === undefined || w.zIndex > top.zIndex ? w : top),
      undefined,
    );
}

export function getWindow(state: WindowManagerState, id: string): DesktopWindow | undefined {
  return state.windows.find((w) => w.id === id);
}

/** Windows ordered bottom → top by z-index (render order). */
export function orderedWindows(state: WindowManagerState): DesktopWindow[] {
  return [...state.windows].sort((a, b) => a.zIndex - b.zIndex);
}

/** Windows in creation order (taskbar order). */
export function taskbarWindows(state: WindowManagerState): DesktopWindow[] {
  return state.windows;
}

export function openWindow(
  state: WindowManagerState,
  options: OpenWindowOptions,
): { state: WindowManagerState; windowId: string } {
  if (options.singleton) {
    const existing = state.windows.find((w) => w.appId === options.appId);
    if (existing) {
      return { state: focusWindow(state, existing.id), windowId: existing.id };
    }
  }

  const size = clampSize(options.width, options.height, state.viewport);
  const wanted =
    options.x !== undefined && options.y !== undefined
      ? { x: options.x, y: options.y }
      : cascadePosition(state, size.width, size.height);
  const position = clampPosition(wanted.x, wanted.y, size.width, size.height, state.viewport);

  const id = `win-${state.nextWindowSeq}`;
  const window: DesktopWindow = {
    id,
    appId: options.appId,
    title: options.title,
    ...position,
    ...size,
    minimized: false,
    maximized: false,
    zIndex: state.nextZIndex,
  };

  return {
    state: {
      ...state,
      windows: [...state.windows, window],
      activeWindowId: id,
      nextZIndex: state.nextZIndex + 1,
      nextWindowSeq: state.nextWindowSeq + 1,
    },
    windowId: id,
  };
}

export function closeWindow(state: WindowManagerState, id: string): WindowManagerState {
  if (!getWindow(state, id)) return state;
  const windows = state.windows.filter((w) => w.id !== id);
  const activeWindowId =
    state.activeWindowId === id ? (topmostVisible(windows)?.id ?? null) : state.activeWindowId;
  return { ...state, windows, activeWindowId };
}

/** Bring a window to the front (and restore it if minimized). */
export function focusWindow(state: WindowManagerState, id: string): WindowManagerState {
  const target = getWindow(state, id);
  if (!target) return state;
  const isTop = topmostVisible(state.windows)?.id === id;
  if (isTop && !target.minimized && state.activeWindowId === id) return state;

  const next = withUpdatedWindow(state, id, (w) => ({
    ...w,
    minimized: false,
    zIndex: state.nextZIndex,
  }));
  return { ...next, activeWindowId: id, nextZIndex: state.nextZIndex + 1 };
}

export function minimizeWindow(state: WindowManagerState, id: string): WindowManagerState {
  const target = getWindow(state, id);
  if (!target || target.minimized) return state;
  const next = withUpdatedWindow(state, id, (w) => ({ ...w, minimized: true }));
  const activeWindowId =
    state.activeWindowId === id ? (topmostVisible(next.windows)?.id ?? null) : state.activeWindowId;
  return { ...next, activeWindowId };
}

/** Taskbar click semantics: minimize if active, otherwise focus/restore. */
export function toggleWindow(state: WindowManagerState, id: string): WindowManagerState {
  const target = getWindow(state, id);
  if (!target) return state;
  if (!target.minimized && state.activeWindowId === id) {
    return minimizeWindow(state, id);
  }
  return focusWindow(state, id);
}

export function maximizeWindow(state: WindowManagerState, id: string): WindowManagerState {
  const target = getWindow(state, id);
  if (!target || target.maximized) return state;
  return focusWindow(
    withUpdatedWindow(state, id, (w) => ({ ...w, maximized: true, minimized: false })),
    id,
  );
}

export function restoreWindow(state: WindowManagerState, id: string): WindowManagerState {
  const target = getWindow(state, id);
  if (!target || !target.maximized) return state;
  return focusWindow(
    withUpdatedWindow(state, id, (w) => ({ ...w, maximized: false })),
    id,
  );
}

export function toggleMaximize(state: WindowManagerState, id: string): WindowManagerState {
  const target = getWindow(state, id);
  if (!target) return state;
  return target.maximized ? restoreWindow(state, id) : maximizeWindow(state, id);
}

/** Absolute move; the position is clamped so the title bar stays reachable. */
export function moveWindow(
  state: WindowManagerState,
  id: string,
  x: number,
  y: number,
): WindowManagerState {
  const target = getWindow(state, id);
  if (!target || target.maximized) return state;
  const position = clampPosition(x, y, target.width, target.height, state.viewport);
  if (position.x === target.x && position.y === target.y) return state;
  return withUpdatedWindow(state, id, (w) => ({ ...w, ...position }));
}

export function resizeWindow(
  state: WindowManagerState,
  id: string,
  width: number,
  height: number,
): WindowManagerState {
  const target = getWindow(state, id);
  if (!target || target.maximized) return state;
  const size = clampSize(width, height, state.viewport);
  if (size.width === target.width && size.height === target.height) return state;
  return withUpdatedWindow(state, id, (w) => ({ ...w, ...size }));
}

/** Viewport change (browser resize): keep every window reachable. */
export function setViewport(state: WindowManagerState, viewport: Viewport): WindowManagerState {
  if (viewport.width === state.viewport.width && viewport.height === state.viewport.height) {
    return state;
  }
  const windows = state.windows.map((w) => {
    const size = clampSize(w.width, w.height, viewport);
    const position = clampPosition(w.x, w.y, size.width, size.height, viewport);
    return { ...w, ...size, ...position };
  });
  return { ...state, viewport, windows };
}

/** Geometry a renderer should use, accounting for the maximized state. */
export function effectiveBounds(
  window: DesktopWindow,
  viewport: Viewport,
): { x: number; y: number; width: number; height: number } {
  if (window.maximized) {
    return { x: 0, y: 0, width: viewport.width, height: viewport.height - TASKBAR_HEIGHT };
  }
  return { x: window.x, y: window.y, width: window.width, height: window.height };
}
