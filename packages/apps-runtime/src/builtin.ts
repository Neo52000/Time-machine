import type { AppDefinition } from "./registry";

/** Phone apps always run full-screen; the size only matters to the registry. */
const PHONE_SCREEN = { width: 360, height: 640 };

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
    id: "bbs",
    title: "Terminal BBS",
    icon: "☎",
    defaultSize: { width: 600, height: 400 },
    singleton: true,
    eras: ["1992"],
  },
  {
    id: "minitel",
    title: "Minitel",
    icon: "▤",
    defaultSize: { width: 640, height: 480 },
    singleton: true,
    eras: ["1985"],
  },
  // 2010 phone: the store installs `torch` and `serpentin` (content/phone/phone.json).
  {
    id: "sms",
    title: "Messages",
    icon: "✉",
    defaultSize: PHONE_SCREEN,
    singleton: true,
    eras: ["2010"],
  },
  {
    id: "camera",
    title: "Photo",
    icon: "📷",
    defaultSize: PHONE_SCREEN,
    singleton: true,
    eras: ["2010"],
  },
  {
    id: "store",
    title: "Boutique",
    icon: "🛍",
    defaultSize: PHONE_SCREEN,
    singleton: true,
    eras: ["2010"],
  },
  {
    id: "settings",
    title: "Réglages",
    icon: "⚙",
    defaultSize: PHONE_SCREEN,
    singleton: true,
    eras: ["2010"],
  },
  {
    id: "torch",
    title: "Lampe de poche",
    icon: "🔦",
    defaultSize: PHONE_SCREEN,
    singleton: true,
    eras: ["2010"],
  },
  {
    id: "serpentin",
    title: "Serpentin",
    icon: "🐍",
    defaultSize: PHONE_SCREEN,
    singleton: true,
    eras: ["2010"],
  },
];
