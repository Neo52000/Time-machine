import { describe, expect, it } from "vitest";
import {
  TASKBAR_HEIGHT,
  closeWindow,
  createWindowManagerState,
  effectiveBounds,
  focusWindow,
  getWindow,
  maximizeWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  orderedWindows,
  resizeWindow,
  restoreWindow,
  setViewport,
  toggleMaximize,
  toggleWindow,
  type WindowManagerState,
} from "./state";

const viewport = { width: 800, height: 600 };

function open(state: WindowManagerState, appId = "notepad", extra = {}) {
  return openWindow(state, { appId, title: appId, width: 400, height: 300, ...extra });
}

describe("openWindow", () => {
  it("opens a focused window with a unique id and increasing z-index", () => {
    const s0 = createWindowManagerState(viewport);
    const a = open(s0, "notepad");
    const b = open(a.state, "terminal");

    expect(a.windowId).not.toEqual(b.windowId);
    expect(b.state.windows).toHaveLength(2);
    expect(b.state.activeWindowId).toBe(b.windowId);
    expect(getWindow(b.state, b.windowId)!.zIndex).toBeGreaterThan(
      getWindow(b.state, a.windowId)!.zIndex,
    );
  });

  it("cascades new windows", () => {
    const a = open(createWindowManagerState(viewport));
    const b = open(a.state);
    const wa = getWindow(b.state, a.windowId)!;
    const wb = getWindow(b.state, b.windowId)!;
    expect(wb.x).toBeGreaterThan(wa.x);
    expect(wb.y).toBeGreaterThan(wa.y);
  });

  it("restarts the cascade instead of pushing windows off-screen", () => {
    let state = createWindowManagerState(viewport);
    for (let i = 0; i < 20; i++) state = open(state).state;
    for (const w of state.windows) {
      expect(w.x + w.width).toBeLessThanOrEqual(viewport.width);
      expect(w.y + w.height).toBeLessThanOrEqual(viewport.height - TASKBAR_HEIGHT);
    }
  });

  it("clamps oversized windows to the usable viewport", () => {
    const { state, windowId } = openWindow(createWindowManagerState(viewport), {
      appId: "browser",
      title: "Browser",
      width: 5000,
      height: 5000,
    });
    const w = getWindow(state, windowId)!;
    expect(w.width).toBe(viewport.width);
    expect(w.height).toBe(viewport.height - TASKBAR_HEIGHT);
  });

  it("singleton apps re-focus the existing window", () => {
    const a = open(createWindowManagerState(viewport), "mail", { singleton: true });
    const other = open(a.state, "notepad");
    const b = open(other.state, "mail", { singleton: true });
    expect(b.windowId).toBe(a.windowId);
    expect(b.state.windows).toHaveLength(2);
    expect(b.state.activeWindowId).toBe(a.windowId);
    expect(orderedWindows(b.state).at(-1)!.id).toBe(a.windowId);
  });
});

describe("focus / close / minimize", () => {
  it("focusing raises the window above the others", () => {
    const a = open(createWindowManagerState(viewport), "a");
    const b = open(a.state, "b");
    const focused = focusWindow(b.state, a.windowId);
    expect(focused.activeWindowId).toBe(a.windowId);
    expect(orderedWindows(focused).map((w) => w.appId)).toEqual(["b", "a"]);
  });

  it("focusing the already active top window is a no-op (same reference)", () => {
    const a = open(createWindowManagerState(viewport), "a");
    expect(focusWindow(a.state, a.windowId)).toBe(a.state);
  });

  it("closing the active window hands focus to the next topmost visible window", () => {
    const a = open(createWindowManagerState(viewport), "a");
    const b = open(a.state, "b");
    const c = open(b.state, "c");
    const minimizedB = minimizeWindow(c.state, b.windowId);
    const closed = closeWindow(minimizedB, c.windowId);
    expect(closed.windows.map((w) => w.appId)).toEqual(["a", "b"]);
    expect(closed.activeWindowId).toBe(a.windowId);
  });

  it("closing the last window clears the active id", () => {
    const a = open(createWindowManagerState(viewport));
    const closed = closeWindow(a.state, a.windowId);
    expect(closed.windows).toHaveLength(0);
    expect(closed.activeWindowId).toBeNull();
  });

  it("closing an unknown id is a no-op", () => {
    const a = open(createWindowManagerState(viewport));
    expect(closeWindow(a.state, "nope")).toBe(a.state);
  });

  it("minimize hides the window and moves focus; focus restores it", () => {
    const a = open(createWindowManagerState(viewport), "a");
    const b = open(a.state, "b");
    const min = minimizeWindow(b.state, b.windowId);
    expect(getWindow(min, b.windowId)!.minimized).toBe(true);
    expect(min.activeWindowId).toBe(a.windowId);

    const restored = focusWindow(min, b.windowId);
    expect(getWindow(restored, b.windowId)!.minimized).toBe(false);
    expect(restored.activeWindowId).toBe(b.windowId);
  });

  it("toggleWindow minimizes the active window and restores an inactive one", () => {
    const a = open(createWindowManagerState(viewport), "a");
    const toggledOnce = toggleWindow(a.state, a.windowId);
    expect(getWindow(toggledOnce, a.windowId)!.minimized).toBe(true);
    const toggledTwice = toggleWindow(toggledOnce, a.windowId);
    expect(getWindow(toggledTwice, a.windowId)!.minimized).toBe(false);
    expect(toggledTwice.activeWindowId).toBe(a.windowId);
  });
});

describe("maximize / restore", () => {
  it("maximize fills the usable viewport without losing the stored geometry", () => {
    const a = open(createWindowManagerState(viewport));
    const before = getWindow(a.state, a.windowId)!;
    const max = maximizeWindow(a.state, a.windowId);
    const w = getWindow(max, a.windowId)!;
    expect(w.maximized).toBe(true);
    expect(w.width).toBe(before.width);
    expect(effectiveBounds(w, viewport)).toEqual({
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height - TASKBAR_HEIGHT,
    });

    const restored = restoreWindow(max, a.windowId);
    expect(effectiveBounds(getWindow(restored, a.windowId)!, viewport)).toEqual({
      x: before.x,
      y: before.y,
      width: before.width,
      height: before.height,
    });
  });

  it("toggleMaximize flips the state", () => {
    const a = open(createWindowManagerState(viewport));
    const s1 = toggleMaximize(a.state, a.windowId);
    expect(getWindow(s1, a.windowId)!.maximized).toBe(true);
    const s2 = toggleMaximize(s1, a.windowId);
    expect(getWindow(s2, a.windowId)!.maximized).toBe(false);
  });

  it("move and resize are ignored while maximized", () => {
    const a = open(createWindowManagerState(viewport));
    const max = maximizeWindow(a.state, a.windowId);
    expect(moveWindow(max, a.windowId, 10, 10)).toBe(max);
    expect(resizeWindow(max, a.windowId, 200, 200)).toBe(max);
  });
});

describe("move / resize / viewport", () => {
  it("moves within bounds and keeps the title bar reachable", () => {
    const a = open(createWindowManagerState(viewport));
    const moved = moveWindow(a.state, a.windowId, 100, 50);
    expect(getWindow(moved, a.windowId)).toMatchObject({ x: 100, y: 50 });

    const offTop = moveWindow(moved, a.windowId, 100, -500);
    expect(getWindow(offTop, a.windowId)!.y).toBe(0);

    const offRight = moveWindow(moved, a.windowId, 5000, 50);
    expect(getWindow(offRight, a.windowId)!.x).toBeLessThan(viewport.width);
  });

  it("resizes with minimum and viewport limits", () => {
    const a = open(createWindowManagerState(viewport));
    const tiny = resizeWindow(a.state, a.windowId, 1, 1);
    const w = getWindow(tiny, a.windowId)!;
    expect(w.width).toBeGreaterThanOrEqual(160);
    expect(w.height).toBeGreaterThanOrEqual(100);

    const huge = resizeWindow(a.state, a.windowId, 9999, 9999);
    expect(getWindow(huge, a.windowId)!.width).toBe(viewport.width);
  });

  it("setViewport re-clamps existing windows", () => {
    const a = open(createWindowManagerState(viewport));
    const moved = moveWindow(a.state, a.windowId, 700, 500);
    const smaller = setViewport(moved, { width: 400, height: 300 });
    const w = getWindow(smaller, a.windowId)!;
    expect(w.width).toBeLessThanOrEqual(400);
    expect(w.x).toBeLessThan(400);
    expect(w.y).toBeLessThanOrEqual(300 - TASKBAR_HEIGHT);
  });
});
