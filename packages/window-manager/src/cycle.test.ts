import { describe, expect, it } from "vitest";
import {
  createWindowManagerState,
  cycleWindow,
  getWindow,
  minimizeWindow,
  openWindow,
  type WindowManagerState,
} from "./state";

const viewport = { width: 800, height: 600 };

function open(state: WindowManagerState, appId: string) {
  return openWindow(state, { appId, title: appId, width: 300, height: 200 }).state;
}

describe("cycleWindow", () => {
  it("is a no-op with no windows", () => {
    const s = createWindowManagerState(viewport);
    expect(cycleWindow(s, 1)).toBe(s);
  });

  it("walks the taskbar order forwards and backwards, wrapping around", () => {
    let s = open(open(open(createWindowManagerState(viewport), "a"), "b"), "c");
    expect(s.activeWindowId).toBe("win-3");
    s = cycleWindow(s, 1);
    expect(s.activeWindowId).toBe("win-1");
    s = cycleWindow(s, 1);
    expect(s.activeWindowId).toBe("win-2");
    s = cycleWindow(s, -1);
    expect(s.activeWindowId).toBe("win-1");
    s = cycleWindow(s, -1);
    expect(s.activeWindowId).toBe("win-3");
  });

  it("restores a minimized window it lands on and brings it to the front", () => {
    let s = open(open(createWindowManagerState(viewport), "a"), "b");
    s = minimizeWindow(s, "win-1");
    s = cycleWindow(s, 1);
    expect(s.activeWindowId).toBe("win-1");
    const restored = getWindow(s, "win-1")!;
    expect(restored.minimized).toBe(false);
    expect(restored.zIndex).toBeGreaterThan(getWindow(s, "win-2")!.zIndex);
  });

  it("starts from the first (or last) window when nothing is active", () => {
    let s = open(open(createWindowManagerState(viewport), "a"), "b");
    s = minimizeWindow(s, "win-2");
    s = minimizeWindow(s, "win-1");
    expect(s.activeWindowId).toBeNull();
    expect(cycleWindow(s, 1).activeWindowId).toBe("win-1");
    expect(cycleWindow(s, -1).activeWindowId).toBe("win-2");
  });
});
