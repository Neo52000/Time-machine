import type { SoundCue, Waveform } from "@time-machine/content-schema";
import type { AudioPreferences } from "./preferences";

/** A segment placed on an absolute timeline, ready for an audio adapter. */
export interface ScheduledSegment {
  startMs: number;
  endMs: number;
  wave: Waveform;
  frequency?: number;
  frequencyTo?: number;
  /** Final gain after the user's volume preference. */
  gain: number;
}

export function cueDurationMs(cue: SoundCue): number {
  return cue.segments.reduce((max, s) => Math.max(max, s.at + s.durationMs), 0);
}

/**
 * Lays a cue out from `startAtMs`, applying the preferences. Returns nothing
 * when audio is disabled or silent so adapters never allocate nodes for
 * inaudible sound.
 */
export function scheduleCue(
  cue: SoundCue,
  startAtMs: number,
  prefs: AudioPreferences,
): ScheduledSegment[] {
  if (!prefs.enabled || prefs.volume <= 0) return [];
  return cue.segments
    .map((s) => ({
      startMs: startAtMs + s.at,
      endMs: startAtMs + s.at + s.durationMs,
      wave: s.wave,
      frequency: s.frequency,
      frequencyTo: s.frequencyTo,
      gain: s.gain * prefs.volume,
    }))
    .sort((a, b) => a.startMs - b.startMs);
}
