import { describe, expect, it } from "vitest";
import { MAX_CUE_DURATION_MS, createAudioCatalog } from "./catalog";
import { audioCatalog } from "./content";
import {
  DEFAULT_AUDIO_PREFERENCES,
  parseAudioPreferences,
  setVolume,
  toggleAudio,
} from "./preferences";
import { resolveSoundCue, unresolvedSoundBindings } from "./resolve";
import { cueDurationMs, scheduleCue } from "./schedule";

import era1985 from "../../../eras/1985/manifest.json";
import era1998 from "../../../eras/1998/manifest.json";
import era2005 from "../../../eras/2005/manifest.json";

const handshake = audioCatalog.get("modem-handshake-v23")!;

describe("audio catalogue", () => {
  it("loads the seed cues, all original", () => {
    expect(audioCatalog.cues.length).toBeGreaterThanOrEqual(10);
    expect(audioCatalog.cues.every((c) => c.rightsStatus === "original")).toBe(true);
  });

  it("rejects a duplicate id", () => {
    expect(() => createAudioCatalog([handshake, handshake])).toThrow(/Duplicate sound cue/);
  });

  it("rejects a sampled (non-original) cue", () => {
    expect(() => createAudioCatalog([{ ...handshake, rightsStatus: "unknown" }])).toThrow(
      /must be "original"/,
    );
  });

  it("rejects a tone segment without a frequency", () => {
    const cue = { ...handshake, segments: [{ at: 0, durationMs: 10, wave: "sine", gain: 0.5 }] };
    expect(() => createAudioCatalog([cue])).toThrow(/has no frequency/);
  });

  it("rejects a cue longer than the limit", () => {
    const cue = {
      ...handshake,
      segments: [{ at: 0, durationMs: MAX_CUE_DURATION_MS + 1, wave: "noise", gain: 0.1 }],
    };
    expect(() => createAudioCatalog([cue])).toThrow(/above the/);
  });
});

describe("scheduling", () => {
  it("measures a cue by its last segment end", () => {
    expect(cueDurationMs(handshake)).toBe(2200);
  });

  it("keeps the handshake inside the Minitel dial latency (2200 ms)", () => {
    // DEFAULT_SESSION_OPTIONS.dialMs in @time-machine/minitel-engine.
    expect(cueDurationMs(handshake)).toBeLessThanOrEqual(2200);
  });

  it("offsets segments from the start time and applies the volume", () => {
    const nudge = audioCatalog.get("im-nudge")!;
    const scheduled = scheduleCue(nudge, 1000, { enabled: true, volume: 0.5 });
    expect(scheduled).toHaveLength(3);
    expect(scheduled[0]).toMatchObject({ startMs: 1000, endMs: 1090, frequency: 783.99 });
    expect(scheduled[0]!.gain).toBeCloseTo(0.08);
    expect(scheduled.map((s) => s.startMs)).toEqual([1000, 1100, 1200]);
  });

  it("schedules nothing when disabled or silent", () => {
    expect(scheduleCue(handshake, 0, { enabled: false, volume: 1 })).toEqual([]);
    expect(scheduleCue(handshake, 0, { enabled: true, volume: 0 })).toEqual([]);
  });
});

describe("preferences", () => {
  it("falls back field by field on unreadable input", () => {
    expect(parseAudioPreferences(null)).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(parseAudioPreferences("nope")).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(parseAudioPreferences({ enabled: false })).toEqual({ enabled: false, volume: 0.5 });
    expect(parseAudioPreferences({ volume: 7 })).toEqual({ enabled: true, volume: 1 });
    expect(parseAudioPreferences({ volume: Number.NaN })).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("toggles and clamps", () => {
    expect(toggleAudio(DEFAULT_AUDIO_PREFERENCES).enabled).toBe(false);
    expect(setVolume(DEFAULT_AUDIO_PREFERENCES, -1).volume).toBe(0);
    expect(setVolume(DEFAULT_AUDIO_PREFERENCES, 0.3).volume).toBe(0.3);
  });
});

describe("era bindings", () => {
  const machines = [era1985, era1998, era2005].map((era) => era.machine);

  it("every seed manifest binding resolves to a cue", () => {
    for (const machine of machines) {
      expect(unresolvedSoundBindings(audioCatalog, machine)).toEqual([]);
    }
  });

  it("resolves the Minitel dial to the handshake and stays silent elsewhere", () => {
    expect(resolveSoundCue(audioCatalog, era1985.machine, "dial")?.id).toBe("modem-handshake-v23");
    expect(resolveSoundCue(audioCatalog, era1998.machine, "dial")).toBeUndefined();
    expect(resolveSoundCue(audioCatalog, { sounds: undefined }, "boot")).toBeUndefined();
  });

  it("reports a binding to an unknown cue", () => {
    expect(unresolvedSoundBindings(audioCatalog, { sounds: { boot: "ghost" } })).toEqual([
      "boot → ghost",
    ]);
  });
});
