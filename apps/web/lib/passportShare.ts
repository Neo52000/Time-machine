import type { EraManifest, PassportStamp } from "@time-machine/content-schema";
import { passportProgress } from "@time-machine/narrative-engine";

export interface SharedEraLine {
  eraId: string;
  label: string;
  stamps: PassportStamp[];
  total: number;
}

/** A shared passport as lines per era (only eras with at least one stamp), for page and card. */
export function sharedPassportLines(
  catalog: readonly PassportStamp[],
  earned: readonly PassportStamp[],
  eras: readonly EraManifest[],
): SharedEraLine[] {
  const passport = Object.fromEntries(earned.map((s) => [s.id, 0]));
  return passportProgress(catalog, passport)
    .filter((p) => p.earned.length > 0)
    .map((p) => ({
      eraId: p.eraId,
      label: eras.find((e) => e.id === p.eraId)?.label ?? p.eraId,
      stamps: p.earned,
      total: p.earned.length + p.missing.length,
    }));
}
