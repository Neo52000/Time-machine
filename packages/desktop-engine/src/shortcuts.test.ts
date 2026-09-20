import { describe, expect, it } from "vitest";
import { DESKTOP_SHORTCUTS, matchShortcut, shortcutLabels, type KeyLike } from "./shortcuts";

function key(partial: Partial<KeyLike> & { key: string }): KeyLike {
  return { ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...partial };
}

describe("matchShortcut", () => {
  it("recognises the Ctrl+Alt desktop chords, case-insensitively for letters", () => {
    expect(matchShortcut(key({ key: "x", ctrlKey: true, altKey: true }))).toBe("close-active");
    expect(matchShortcut(key({ key: "X", ctrlKey: true, altKey: true }))).toBe("close-active");
    expect(matchShortcut(key({ key: "m", ctrlKey: true, altKey: true }))).toBe("minimize-active");
    expect(matchShortcut(key({ key: "Enter", ctrlKey: true, altKey: true }))).toBe(
      "toggle-maximize-active",
    );
    expect(matchShortcut(key({ key: "s", ctrlKey: true, altKey: true }))).toBe("toggle-start-menu");
    expect(matchShortcut(key({ key: "ArrowRight", ctrlKey: true, altKey: true }))).toBe(
      "cycle-next",
    );
    expect(matchShortcut(key({ key: "ArrowLeft", ctrlKey: true, altKey: true }))).toBe(
      "cycle-prev",
    );
  });

  it("recognises Alt+Tab and Alt+Shift+Tab", () => {
    expect(matchShortcut(key({ key: "Tab", altKey: true }))).toBe("cycle-next");
    expect(matchShortcut(key({ key: "Tab", altKey: true, shiftKey: true }))).toBe("cycle-prev");
  });

  it("ignores plain keys, partial modifiers and anything with Meta", () => {
    expect(matchShortcut(key({ key: "x" }))).toBeUndefined();
    expect(matchShortcut(key({ key: "x", ctrlKey: true }))).toBeUndefined();
    expect(matchShortcut(key({ key: "Tab" }))).toBeUndefined();
    expect(
      matchShortcut(key({ key: "x", ctrlKey: true, altKey: true, metaKey: true })),
    ).toBeUndefined();
  });

  it("lists one label per command", () => {
    const labels = shortcutLabels();
    expect(labels.map((l) => l.command)).toEqual([
      "cycle-next",
      "cycle-prev",
      "close-active",
      "minimize-active",
      "toggle-maximize-active",
      "toggle-start-menu",
    ]);
    expect(new Set(DESKTOP_SHORTCUTS.map((s) => s.command)).size).toBe(labels.length);
  });
});
