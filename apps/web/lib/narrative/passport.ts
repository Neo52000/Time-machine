"use client";

import { useEffect, useState } from "react";
import {
  narrativeCatalog,
  parsePassport,
  stampPassport,
  type Passport,
} from "@time-machine/narrative-engine";

export const PASSPORT_STORAGE_KEY = "time-machine-passport";
/** Fired on `window` whenever a stamp is added, so open pages refresh their passport. */
export const PASSPORT_CHANGED_EVENT = "tm:passport";

const knownIds = new Set(narrativeCatalog.stamps.map((s) => s.id));

/** Stamps earned in this browser; empty on the server or when storage is unavailable. */
export function readPassport(): Passport {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PASSPORT_STORAGE_KEY);
    return raw ? parsePassport(JSON.parse(raw), knownIds) : {};
  } catch {
    return {};
  }
}

/** Adds a stamp; returns true when it is new (so the UI can celebrate it once). */
export function awardStamp(stampId: string, at = Date.now()): boolean {
  const current = readPassport();
  const next = stampPassport(current, stampId, at);
  if (next === current) return false;
  try {
    window.localStorage.setItem(PASSPORT_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota: the stamp still counts for this session's story.
  }
  window.dispatchEvent(new CustomEvent(PASSPORT_CHANGED_EVENT, { detail: { stampId } }));
  return true;
}

/** Live passport for a component: read after mount (no hydration mismatch), kept in sync. */
export function usePassport(): Passport {
  const [passport, setPassport] = useState<Passport>({});
  useEffect(() => {
    const refresh = () => setPassport(readPassport());
    refresh();
    window.addEventListener(PASSPORT_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PASSPORT_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return passport;
}
