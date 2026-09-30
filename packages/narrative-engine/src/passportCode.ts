import type { PassportStamp } from "@time-machine/content-schema";
import type { Passport } from "./passport";

/**
 * A shareable passport is just the list of earned stamp ids in the URL —
 * readable, no server, no timestamps, nothing about the visitor. Ids are
 * already URL-safe (`[a-z0-9-]`), so the code is them joined by ".".
 */
export const PASSPORT_CODE_SEPARATOR = ".";

/** Earned stamps in catalogue order, so the same passport always gives the same code. */
export function encodePassport(stamps: readonly PassportStamp[], passport: Passport): string {
  return stamps
    .filter((s) => s.id in passport)
    .map((s) => s.id)
    .join(PASSPORT_CODE_SEPARATOR);
}

/**
 * Stamps a code names, in catalogue order. Unknown ids are dropped (a stamp
 * renamed since the link was shared); `null` when nothing valid remains.
 */
export function decodePassport(
  stamps: readonly PassportStamp[],
  code: string,
): PassportStamp[] | null {
  let raw: string;
  try {
    raw = decodeURIComponent(code);
  } catch {
    return null;
  }
  const ids = new Set(raw.split(PASSPORT_CODE_SEPARATOR));
  const earned = stamps.filter((s) => ids.has(s.id));
  return earned.length > 0 ? earned : null;
}
