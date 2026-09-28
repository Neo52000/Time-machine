import type { PassportStamp } from "@time-machine/content-schema";

/**
 * The visitor's passport: which stamps they earned and when (epoch ms).
 * Pure helpers — storage lives in the web app, like the audio preferences.
 */
export type Passport = Record<string, number>;

/** Tolerant parse of stored data: anything malformed becomes an empty passport. */
export function parsePassport(raw: unknown, knownIds?: ReadonlySet<string>): Passport {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const passport: Passport = {};
  for (const [id, at] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof at !== "number" || !Number.isFinite(at)) continue;
    if (knownIds && !knownIds.has(id)) continue;
    passport[id] = at;
  }
  return passport;
}

/** Returns the same object when the stamp is already there (first award wins). */
export function stampPassport(passport: Passport, stampId: string, at: number): Passport {
  return stampId in passport ? passport : { ...passport, [stampId]: at };
}

export interface EraProgress {
  eraId: string;
  earned: PassportStamp[];
  missing: PassportStamp[];
}

/** Stamps per era, in catalogue order, split into earned and still to find. */
export function passportProgress(
  stamps: readonly PassportStamp[],
  passport: Passport,
): EraProgress[] {
  const byEra = new Map<string, EraProgress>();
  for (const stamp of stamps) {
    let progress = byEra.get(stamp.eraId);
    if (!progress) {
      progress = { eraId: stamp.eraId, earned: [], missing: [] };
      byEra.set(stamp.eraId, progress);
    }
    (stamp.id in passport ? progress.earned : progress.missing).push(stamp);
  }
  return [...byEra.values()];
}
