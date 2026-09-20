import { z } from "zod";
import { RightsStatusSchema } from "./rights";

/**
 * Sound cues are *synthesised*, never sampled: a cue is a list of tone /
 * noise segments an audio adapter renders with oscillators. That keeps every
 * sound an original creation of this project (no trademarked boot chimes,
 * no recorded modem) and keeps the data small enough to live in JSON.
 */
export const WaveformSchema = z.enum(["sine", "square", "sawtooth", "triangle", "noise"]);

export const CueSegmentSchema = z.object({
  /** Offset from the start of the cue, in ms. */
  at: z.number().min(0),
  durationMs: z.number().positive(),
  wave: WaveformSchema,
  /** Required for every waveform except `noise`. */
  frequency: z.number().positive().optional(),
  /** Optional linear glide target reached at the end of the segment. */
  frequencyTo: z.number().positive().optional(),
  /** Peak gain, 0..1, before the user's volume preference is applied. */
  gain: z.number().min(0).max(1),
});

export const SoundCueSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  segments: z.array(CueSegmentSchema).min(1),
  rightsStatus: RightsStatusSchema,
});

/** The moments a machine can react to with a sound. Eras bind them to cue ids. */
export const SoundEventSchema = z.enum([
  "boot",
  "window-open",
  "window-close",
  "notification",
  "dial",
  "connect",
  "disconnect",
  "error",
]);

export type Waveform = z.infer<typeof WaveformSchema>;
export type CueSegment = z.infer<typeof CueSegmentSchema>;
export type SoundCue = z.infer<typeof SoundCueSchema>;
export type SoundEvent = z.infer<typeof SoundEventSchema>;
