/**
 * Theme resolution — maps `EraManifest.machine.theme` to a set of design
 * tokens the desktop renders through CSS custom properties. Themes are
 * data: adding an era never requires touching a component.
 */
export interface DesktopTheme {
  id: string;
  /** Human label shown in the "About" area. */
  name: string;
  /** Text label of the taskbar's launcher button. */
  startLabel: string;
  /** CSS custom properties applied on the desktop root. */
  tokens: Record<`--${string}`, string>;
  /** Visual style hints the renderer can branch on (never era ids). */
  windowStyle: "bevel" | "flat" | "text";
  /** Simulated CRT scanline overlay. */
  crt: boolean;
}

const themes: Record<string, DesktopTheme> = {
  "beige-crt-1998": {
    id: "beige-crt-1998",
    name: "Time Machine OS 98",
    startLabel: "Démarrer",
    windowStyle: "bevel",
    crt: true,
    tokens: {
      "--tm-desktop": "#008080",
      "--tm-surface": "#c0c0c0",
      "--tm-surface-light": "#ffffff",
      "--tm-surface-dark": "#808080",
      "--tm-surface-darker": "#404040",
      "--tm-text": "#000000",
      "--tm-text-muted": "#555555",
      "--tm-title-active-from": "#000080",
      "--tm-title-active-to": "#1084d0",
      "--tm-title-inactive-from": "#808080",
      "--tm-title-inactive-to": "#b5b5b5",
      "--tm-title-text": "#ffffff",
      "--tm-icon-text": "#ffffff",
      "--tm-selection": "#000080",
      "--tm-content": "#ffffff",
      "--tm-font": '"Tahoma", "MS Sans Serif", "Segoe UI", Arial, sans-serif',
      "--tm-font-mono": '"Lucida Console", "Courier New", monospace',
    },
  },
  "silver-flatscreen-2005": {
    id: "silver-flatscreen-2005",
    name: "Time Machine OS 2005",
    startLabel: "démarrer",
    windowStyle: "flat",
    crt: false,
    tokens: {
      "--tm-desktop": "#2f6fd0",
      "--tm-surface": "#ece9d8",
      "--tm-surface-light": "#ffffff",
      "--tm-surface-dark": "#aca899",
      "--tm-surface-darker": "#716f64",
      "--tm-text": "#000000",
      "--tm-text-muted": "#4e4e4e",
      "--tm-title-active-from": "#0a246a",
      "--tm-title-active-to": "#3a6ea5",
      "--tm-title-inactive-from": "#7a96df",
      "--tm-title-inactive-to": "#9db9eb",
      "--tm-title-text": "#ffffff",
      "--tm-icon-text": "#ffffff",
      "--tm-selection": "#316ac5",
      "--tm-content": "#ffffff",
      "--tm-font": '"Trebuchet MS", "Segoe UI", Tahoma, Arial, sans-serif',
      "--tm-font-mono": '"Lucida Console", "Courier New", monospace',
    },
  },
  "minitel-videotex": {
    id: "minitel-videotex",
    name: "Minitel 1B",
    startLabel: "Sommaire",
    windowStyle: "text",
    crt: true,
    tokens: {
      "--tm-desktop": "#000000",
      "--tm-surface": "#000000",
      "--tm-surface-light": "#d0d0d0",
      "--tm-surface-dark": "#404040",
      "--tm-surface-darker": "#202020",
      "--tm-text": "#e6e6e6",
      "--tm-text-muted": "#8a8a8a",
      "--tm-title-active-from": "#e6e6e6",
      "--tm-title-active-to": "#e6e6e6",
      "--tm-title-inactive-from": "#606060",
      "--tm-title-inactive-to": "#606060",
      "--tm-title-text": "#000000",
      "--tm-icon-text": "#e6e6e6",
      "--tm-selection": "#e6e6e6",
      "--tm-content": "#000000",
      "--tm-font": '"Courier New", monospace',
      "--tm-font-mono": '"Courier New", monospace',
    },
  },
};

export function getDesktopTheme(key: string): DesktopTheme {
  const theme = themes[key];
  if (theme) return theme;
  // Unknown theme key: reuse the 1998 look so a new era still renders.
  return { ...themes["beige-crt-1998"]!, id: key, name: key };
}

export function listDesktopThemes(): DesktopTheme[] {
  return Object.values(themes);
}
