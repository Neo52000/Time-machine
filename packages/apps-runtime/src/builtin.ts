import type { AppDefinition } from "./registry";

/**
 * Apps shipped with the MVP. Rendering components live in
 * `apps/web/components/apps/`; this list is the single source of truth for
 * window defaults so every era gets consistent behaviour.
 */
export const builtinApps: AppDefinition[] = [
  {
    id: "browser",
    title: "Time Browser",
    icon: "🌐",
    defaultSize: { width: 640, height: 440 },
    singleton: false,
  },
  {
    id: "file-manager",
    title: "Explorateur",
    icon: "🗂",
    defaultSize: { width: 520, height: 360 },
    singleton: false,
  },
  {
    id: "notepad",
    title: "Bloc-notes",
    icon: "📝",
    defaultSize: { width: 460, height: 340 },
    singleton: false,
  },
  {
    id: "terminal",
    title: "Invite de commandes",
    icon: "▮",
    defaultSize: { width: 560, height: 340 },
    singleton: false,
  },
  {
    id: "mail",
    title: "Courrier",
    icon: "✉",
    defaultSize: { width: 600, height: 400 },
    singleton: true,
  },
  {
    id: "messenger",
    title: "Messenger",
    icon: "💬",
    defaultSize: { width: 320, height: 460 },
    singleton: true,
  },
  {
    id: "media-player",
    title: "Lecteur multimédia",
    icon: "▶",
    defaultSize: { width: 480, height: 380 },
    singleton: true,
  },
  {
    id: "minitel",
    title: "Minitel",
    icon: "▤",
    defaultSize: { width: 640, height: 480 },
    singleton: true,
    eras: ["1985"],
  },
];
