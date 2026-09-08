import type { ComponentType } from "react";
import { BrowserApp } from "./BrowserApp";
import { FileManagerApp } from "./FileManagerApp";
import { MailApp } from "./MailApp";
import { NotepadApp } from "./NotepadApp";
import { PlaceholderApp } from "./PlaceholderApp";
import { TerminalApp } from "./TerminalApp";
import type { AppProps } from "./types";

/**
 * appId → React component. Ids match `builtinApps` in
 * `@time-machine/apps-runtime`; anything without a dedicated component falls
 * back to `PlaceholderApp` so an era never renders an empty window.
 */
const components: Record<string, ComponentType<AppProps>> = {
  browser: BrowserApp,
  "file-manager": FileManagerApp,
  notepad: NotepadApp,
  terminal: TerminalApp,
  mail: MailApp,
};

export function getAppComponent(appId: string): ComponentType<AppProps> {
  return components[appId] ?? PlaceholderApp;
}
