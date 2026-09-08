import type { AppDefinition } from "@time-machine/apps-runtime";
import type { EraManifest } from "@time-machine/content-schema";
import type { VirtualFileSystem } from "@time-machine/desktop-engine";
import type { WindowPayload } from "@/lib/desktopStore";

export interface AppProps {
  windowId: string;
  app: AppDefinition;
  era: EraManifest;
  fs: VirtualFileSystem;
  payload: WindowPayload;
  /** Launch another app (e.g. the file manager opening a text file in notepad). */
  openApp: (appId: string, payload?: WindowPayload) => void;
  closeSelf: () => void;
}
