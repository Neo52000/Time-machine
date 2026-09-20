/**
 * Desktop-wide keyboard shortcuts, as data + a pure matcher. The bindings
 * avoid everything a browser or OS grabs first (Alt+F4, Ctrl+W, Alt+Tab on
 * most platforms) by using Ctrl+Alt as the desktop's own modifier; Alt+Tab
 * is still recognised for the browsers that let it through.
 */
export type DesktopCommand =
  | "cycle-next"
  | "cycle-prev"
  | "close-active"
  | "minimize-active"
  | "toggle-maximize-active"
  | "toggle-start-menu";

export interface KeyChord {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
}

export interface Shortcut {
  command: DesktopCommand;
  chord: KeyChord;
  /** Human label shown in the start menu / docs. */
  label: string;
}

export const DESKTOP_SHORTCUTS: Shortcut[] = [
  { command: "cycle-next", chord: { key: "Tab", alt: true }, label: "Alt+Tab" },
  { command: "cycle-prev", chord: { key: "Tab", alt: true, shift: true }, label: "Alt+Maj+Tab" },
  {
    command: "cycle-next",
    chord: { key: "ArrowRight", ctrl: true, alt: true },
    label: "Ctrl+Alt+→",
  },
  {
    command: "cycle-prev",
    chord: { key: "ArrowLeft", ctrl: true, alt: true },
    label: "Ctrl+Alt+←",
  },
  { command: "close-active", chord: { key: "x", ctrl: true, alt: true }, label: "Ctrl+Alt+X" },
  { command: "minimize-active", chord: { key: "m", ctrl: true, alt: true }, label: "Ctrl+Alt+M" },
  {
    command: "toggle-maximize-active",
    chord: { key: "Enter", ctrl: true, alt: true },
    label: "Ctrl+Alt+Entrée",
  },
  { command: "toggle-start-menu", chord: { key: "s", ctrl: true, alt: true }, label: "Ctrl+Alt+S" },
];

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

function chordMatches(chord: KeyChord, e: KeyLike): boolean {
  if (e.metaKey) return false;
  const key = chord.key.length === 1 ? e.key.toLowerCase() : e.key;
  return (
    key === chord.key &&
    Boolean(chord.ctrl) === e.ctrlKey &&
    Boolean(chord.alt) === e.altKey &&
    Boolean(chord.shift) === e.shiftKey
  );
}

export function matchShortcut(e: KeyLike): DesktopCommand | undefined {
  return DESKTOP_SHORTCUTS.find((s) => chordMatches(s.chord, e))?.command;
}

/** One label per command, for display (first binding wins). */
export function shortcutLabels(): { command: DesktopCommand; label: string }[] {
  const seen = new Set<DesktopCommand>();
  return DESKTOP_SHORTCUTS.filter((s) => {
    if (seen.has(s.command)) return false;
    seen.add(s.command);
    return true;
  }).map(({ command, label }) => ({ command, label }));
}
