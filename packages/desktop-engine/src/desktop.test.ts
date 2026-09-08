import { describe, expect, it } from "vitest";
import { bootDurationMs, bootTimeline, getBootSequence } from "./boot";
import { createEraClock, eraNow, formatEraDate, formatEraTime } from "./clock";
import {
  getFileSystem,
  joinPath,
  listDirectory,
  normalizePath,
  parentPath,
  readTextFile,
} from "./filesystem";
import { getDesktopTheme, listDesktopThemes } from "./theme";

describe("boot sequences", () => {
  it("resolves the 1998 sequence with cumulative timings", () => {
    const seq = getBootSequence("pc-1998-boot");
    expect(seq.lines.length).toBeGreaterThan(3);
    const timeline = bootTimeline(seq);
    expect(timeline[0]).toBe(0);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i]!).toBeGreaterThanOrEqual(timeline[i - 1]!);
    }
    expect(bootDurationMs(seq)).toBe(timeline.at(-1)! + seq.holdMs);
  });

  it("falls back to a generic sequence for unknown keys", () => {
    const seq = getBootSequence("unknown-machine");
    expect(seq.id).toBe("unknown-machine");
    expect(seq.lines.length).toBeGreaterThan(0);
  });
});

describe("themes", () => {
  it("resolves every known theme with the token set the desktop needs", () => {
    for (const theme of listDesktopThemes()) {
      expect(theme.tokens["--tm-desktop"]).toBeTruthy();
      expect(theme.tokens["--tm-surface"]).toBeTruthy();
      expect(theme.tokens["--tm-font"]).toBeTruthy();
    }
  });

  it("falls back to the 1998 look for unknown theme keys", () => {
    const theme = getDesktopTheme("neon-2040");
    expect(theme.id).toBe("neon-2040");
    expect(theme.tokens).toEqual(getDesktopTheme("beige-crt-1998").tokens);
  });
});

describe("virtual filesystem", () => {
  const fs = getFileSystem("pc-1998");

  it("normalizes paths", () => {
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("Mes Documents/")).toBe("/Mes Documents");
    expect(parentPath("/Mes Documents/LISEZMOI.txt")).toBe("/Mes Documents");
    expect(parentPath("/Temp")).toBe("/");
    expect(joinPath("/", "Temp")).toBe("/Temp");
    expect(joinPath("/Temp", "a.txt")).toBe("/Temp/a.txt");
  });

  it("lists the root with directories first and hidden files excluded", () => {
    const entries = listDirectory(fs, "/");
    const names = entries.map((f) => f.name);
    expect(names).not.toContain("win386.swp");
    expect(names).not.toContain("C:");
    const firstFileIdx = entries.findIndex((f) => f.type !== "directory");
    const lastDirIdx = entries.map((f) => f.type).lastIndexOf("directory");
    expect(lastDirIdx).toBeLessThan(firstFileIdx);
  });

  it("reads text files and refuses directories", () => {
    expect(readTextFile(fs, "/Mes Documents/LISEZMOI.txt")).toContain("1998");
    expect(readTextFile(fs, "/Mes Documents")).toBeUndefined();
    expect(readTextFile(fs, "/nope.txt")).toBeUndefined();
  });

  it("unknown machines get an empty disk", () => {
    const empty = getFileSystem("toaster");
    expect(listDirectory(empty, "/")).toEqual([]);
  });
});

describe("era clock", () => {
  it("starts on the era's first day and advances in real time", () => {
    const clock = createEraClock("1998-01-01", 1_000_000);
    const start = eraNow(clock, 1_000_000);
    expect(formatEraDate(start)).toBe("01/01/1998");
    expect(formatEraTime(start)).toBe("09:41");
    const later = eraNow(clock, 1_000_000 + 61 * 60 * 1000);
    expect(formatEraTime(later)).toBe("10:42");
  });

  it("never runs backwards if the real clock is earlier than boot", () => {
    const clock = createEraClock("2005-06-15", 5_000);
    expect(eraNow(clock, 1_000).getTime()).toBe(clock.epoch.getTime());
  });
});
