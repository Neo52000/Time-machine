import dynamic from "next/dynamic";
import { createElement, type ComponentType } from "react";
import { PlaceholderApp } from "./PlaceholderApp";
import type { AppProps } from "./types";

const loading = () => createElement("div", { className: "tm-app-loading" }, "Chargement…");

/** Each app is its own chunk: a Minitel-only era never downloads the Web catalogue. */
function lazy(load: () => Promise<{ default: ComponentType<AppProps> }>) {
  return dynamic(load, { ssr: false, loading });
}

/**
 * appId → React component. Ids match `builtinApps` in
 * `@time-machine/apps-runtime`; anything without a dedicated component falls
 * back to `PlaceholderApp` so an era never renders an empty window.
 */
const components: Record<string, ComponentType<AppProps>> = {
  browser: lazy(() => import("./BrowserApp").then((m) => ({ default: m.BrowserApp }))),
  "file-manager": lazy(() =>
    import("./FileManagerApp").then((m) => ({ default: m.FileManagerApp })),
  ),
  notepad: lazy(() => import("./NotepadApp").then((m) => ({ default: m.NotepadApp }))),
  terminal: lazy(() => import("./TerminalApp").then((m) => ({ default: m.TerminalApp }))),
  mail: lazy(() => import("./MailApp").then((m) => ({ default: m.MailApp }))),
  minitel: lazy(() => import("./MinitelApp").then((m) => ({ default: m.MinitelApp }))),
  messenger: lazy(() => import("./MessengerApp").then((m) => ({ default: m.MessengerApp }))),
  "media-player": lazy(() =>
    import("./MediaPlayerApp").then((m) => ({ default: m.MediaPlayerApp })),
  ),
};

export function getAppComponent(appId: string): ComponentType<AppProps> {
  return components[appId] ?? PlaceholderApp;
}
