import { SoundCueSchema, type SoundCue } from "@time-machine/content-schema";
import { cueDurationMs } from "./schedule";

export interface AudioCatalog {
  cues: SoundCue[];
  get(id: string): SoundCue | undefined;
}

/** Anything longer is a jingle, not a cue — and would outlive the UI moment it decorates. */
export const MAX_CUE_DURATION_MS = 15_000;

/**
 * Validates cues fail-fast, like every other catalogue. Beyond the schema it
 * enforces the two rules that keep the audio layer safe: every cue is an
 * original synthesis (`rightsStatus: "original"`, since nothing is sampled)
 * and every tone segment has a frequency to play.
 */
export function createAudioCatalog(raw: unknown[]): AudioCatalog {
  const cues = raw.map((entry) => SoundCueSchema.parse(entry));
  const byId = new Map<string, SoundCue>();

  for (const cue of cues) {
    if (byId.has(cue.id)) throw new Error(`Duplicate sound cue id "${cue.id}"`);
    if (cue.rightsStatus !== "original") {
      throw new Error(
        `Sound cue "${cue.id}" must be "original": cues are synthesised, never sampled`,
      );
    }
    cue.segments.forEach((segment, index) => {
      if (segment.wave !== "noise" && segment.frequency === undefined) {
        throw new Error(`Sound cue "${cue.id}" segment ${index} has no frequency`);
      }
    });
    const duration = cueDurationMs(cue);
    if (duration > MAX_CUE_DURATION_MS) {
      throw new Error(
        `Sound cue "${cue.id}" lasts ${duration} ms, above the ${MAX_CUE_DURATION_MS} ms limit`,
      );
    }
    byId.set(cue.id, cue);
  }

  return { cues, get: (id) => byId.get(id) };
}
