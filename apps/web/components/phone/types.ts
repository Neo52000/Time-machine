import type { EraManifest } from "@time-machine/content-schema";
import type { EraClock } from "@time-machine/desktop-engine";

export interface PhoneAppProps {
  era: EraManifest;
  /** Simulated clock; apps read the era date from it, never `Date.now()`. */
  clock: EraClock;
  /** Switches the screen to another app (e.g. the store opening what it installed). */
  openApp: (appId: string) => void;
}
