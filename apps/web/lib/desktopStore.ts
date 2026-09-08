"use client";

import { create } from "zustand";
import type { AppDefinition } from "@time-machine/apps-runtime";
import {
  closeWindow,
  createWindowManagerState,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  setViewport,
  toggleMaximize,
  toggleWindow,
  type Viewport,
  type WindowManagerState,
} from "@time-machine/window-manager";

/** Free-form data handed to an app when its window opens (e.g. a file to show). */
export type WindowPayload = Record<string, unknown>;

interface DesktopStore {
  wm: WindowManagerState;
  payloads: Record<string, WindowPayload>;
  startMenuOpen: boolean;

  reset: (viewport: Viewport) => void;
  setViewport: (viewport: Viewport) => void;
  open: (app: AppDefinition, payload?: WindowPayload) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  toggleFromTaskbar: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, width: number, height: number) => void;
  setStartMenuOpen: (open: boolean) => void;
}

const DEFAULT_VIEWPORT: Viewport = { width: 800, height: 600 };

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  wm: createWindowManagerState(DEFAULT_VIEWPORT),
  payloads: {},
  startMenuOpen: false,

  reset: (viewport) =>
    set({ wm: createWindowManagerState(viewport), payloads: {}, startMenuOpen: false }),

  setViewport: (viewport) => set((s) => ({ wm: setViewport(s.wm, viewport) })),

  open: (app, payload) => {
    const { state, windowId } = openWindow(get().wm, {
      appId: app.id,
      title: app.title,
      width: app.defaultSize.width,
      height: app.defaultSize.height,
      singleton: app.singleton,
    });
    set((s) => ({
      wm: state,
      payloads: payload ? { ...s.payloads, [windowId]: payload } : s.payloads,
      startMenuOpen: false,
    }));
    return windowId;
  },

  close: (id) =>
    set((s) => {
      const rest = { ...s.payloads };
      delete rest[id];
      return { wm: closeWindow(s.wm, id), payloads: rest };
    }),

  focus: (id) => set((s) => ({ wm: focusWindow(s.wm, id), startMenuOpen: false })),
  minimize: (id) => set((s) => ({ wm: minimizeWindow(s.wm, id) })),
  toggleMaximize: (id) => set((s) => ({ wm: toggleMaximize(s.wm, id) })),
  toggleFromTaskbar: (id) => set((s) => ({ wm: toggleWindow(s.wm, id), startMenuOpen: false })),
  move: (id, x, y) => set((s) => ({ wm: moveWindow(s.wm, id, x, y) })),
  resize: (id, width, height) => set((s) => ({ wm: resizeWindow(s.wm, id, width, height) })),
  setStartMenuOpen: (open) => set({ startMenuOpen: open }),
}));
