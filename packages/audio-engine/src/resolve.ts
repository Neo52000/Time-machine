import type { EraMachine, SoundCue, SoundEvent } from "@time-machine/content-schema";
import type { AudioCatalog } from "./catalog";

type SoundBindings = Pick<EraMachine, "sounds">;

/** The cue an era's machine plays for an event, or nothing — silence is a valid binding. */
export function resolveSoundCue(
  catalog: AudioCatalog,
  machine: SoundBindings,
  event: SoundEvent,
): SoundCue | undefined {
  const cueId = machine.sounds?.[event];
  return cueId ? catalog.get(cueId) : undefined;
}

/** Bindings that point at a cue the catalogue does not have — a content bug to fail on. */
export function unresolvedSoundBindings(catalog: AudioCatalog, machine: SoundBindings): string[] {
  return Object.entries(machine.sounds ?? {})
    .filter(([, cueId]) => !catalog.get(cueId))
    .map(([event, cueId]) => `${event} → ${cueId}`);
}
