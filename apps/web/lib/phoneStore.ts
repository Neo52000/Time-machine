"use client";

import { create } from "zustand";
import type { PhoneRadio } from "@time-machine/content-schema";
import {
  createSmsState,
  markRead,
  phoneCatalog,
  receiveSms,
  sendSms,
  tickSms,
  type SmsState,
} from "@time-machine/phone-engine";

export interface Photo {
  id: number;
  /** Seed of the original picture drawn for this shot. */
  hue: number;
  /** Era date-time label, e.g. "14/03/2010 09:52". */
  takenAt: string;
}

/**
 * State of the 2010 phone for one session: radios, SMS, installed apps,
 * photos and the mobile data used. It outlives the app on screen (going
 * home never loses a conversation) and is reset when the era loads.
 */
interface PhoneStore {
  /** App on screen; null = home screen. */
  current: string | null;
  /** Conversation open in Messages, so its SMS arrive without a balloon. */
  thread: string | null;
  wifi: boolean;
  airplane: boolean;
  /** Bytes counted against the monthly allowance. */
  meteredBytes: number;
  installed: string[];
  photos: Photo[];
  sms: SmsState;

  reset: () => void;
  open: (appId: string | null) => void;
  openThread: (contactId: string | null) => void;
  setWifi: (on: boolean) => void;
  setAirplane: (on: boolean) => void;
  addMetered: (bytes: number) => void;
  install: (appId: string) => void;
  addPhoto: (photo: Omit<Photo, "id">) => void;
  tick: (deltaMs: number) => void;
  send: (contactId: string, text: string) => void;
  receive: (contactId: string, text: string) => void;
  read: (contactId: string) => void;
}

const initial = (): Pick<
  PhoneStore,
  "current" | "thread" | "wifi" | "airplane" | "meteredBytes" | "installed" | "photos" | "sms"
> => ({
  current: null,
  thread: null,
  wifi: false,
  airplane: false,
  meteredBytes: 0,
  installed: [],
  photos: [],
  sms: createSmsState(),
});

export const usePhoneStore = create<PhoneStore>((set) => ({
  ...initial(),
  reset: () => set(initial()),
  open: (current) => set({ current }),
  openThread: (thread) => set({ thread }),
  setWifi: (wifi) => set({ wifi }),
  setAirplane: (airplane) => set({ airplane }),
  addMetered: (bytes) => set((s) => ({ meteredBytes: s.meteredBytes + bytes })),
  install: (appId) =>
    set((s) => (s.installed.includes(appId) ? s : { installed: [...s.installed, appId] })),
  addPhoto: (photo) =>
    set((s) => ({ photos: [...s.photos, { ...photo, id: (s.photos.at(-1)?.id ?? 0) + 1 }] })),
  tick: (deltaMs) => set((s) => ({ sms: tickSms(s.sms, phoneCatalog, deltaMs) })),
  send: (contactId, text) => set((s) => ({ sms: sendSms(s.sms, phoneCatalog, contactId, text) })),
  receive: (contactId, text) => set((s) => ({ sms: receiveSms(s.sms, contactId, text) })),
  read: (contactId) => set((s) => ({ sms: markRead(s.sms, contactId) })),
}));

/** The radio data goes through now, or null in airplane mode. */
export function useActiveRadio(): PhoneRadio | null {
  const wifi = usePhoneStore((s) => s.wifi);
  const airplane = usePhoneStore((s) => s.airplane);
  if (airplane) return null;
  return phoneCatalog.getRadio(wifi ? "wifi" : "mobile");
}
