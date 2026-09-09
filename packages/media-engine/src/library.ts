import type { VideoClip } from "@time-machine/content-schema";
import type { MediaCatalog } from "./catalog";

/** A clip only exists in the library once its upload date has passed. */
export function isUnlocked(clip: Pick<VideoClip, "uploadDate">, selectedDate: string): boolean {
  return clip.uploadDate <= selectedDate;
}

const MS_PER_DAY = 86_400_000;

/**
 * Deterministic, explainable view-count growth: views double every ten days
 * since upload, capped so the number stays plausible for a brand-new 2005
 * service. Locked clips (not uploaded yet) have no views.
 */
export function estimateViews(clip: VideoClip, selectedDate: string): number {
  if (!isUnlocked(clip, selectedDate)) return 0;
  const days = Math.max(0, (Date.parse(selectedDate) - Date.parse(clip.uploadDate)) / MS_PER_DAY);
  const growth = 1 + days / 10;
  return Math.round(clip.viewsAtLaunch * Math.min(growth, 50));
}

export interface LibraryEntry {
  clip: VideoClip;
  unlocked: boolean;
  views: number;
}

export function listLibrary(catalog: MediaCatalog, selectedDate: string): LibraryEntry[] {
  return catalog.videos
    .map((clip) => ({
      clip,
      unlocked: isUnlocked(clip, selectedDate),
      views: estimateViews(clip, selectedDate),
    }))
    .sort((a, b) => a.clip.uploadDate.localeCompare(b.clip.uploadDate));
}
