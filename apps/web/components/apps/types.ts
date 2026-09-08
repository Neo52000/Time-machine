import type { AppDefinition } from "@time-machine/apps-runtime";
import type { EraManifest } from "@time-machine/content-schema";
import type { EraClock, VirtualFileSystem } from "@time-machine/desktop-engine";
import type { WindowPayload } from "@/lib/desktopStore";

export interface AppProps {
  windowId: string;
  app: AppDefinition;
  era: EraManifest;
  fs: VirtualFileSystem;
  /** Simulated clock of the machine; apps read the era date from it, never `Date.now()`. */
  clock: EraClock;
  payload: WindowPayload;
  /** Launch another app (e.g. the file manager opening a text file in notepad). */
  openApp: (appId: string, payload?: WindowPayload) => void;
  closeSelf: () => void;
}
