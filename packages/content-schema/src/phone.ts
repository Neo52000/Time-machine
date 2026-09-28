import { z } from "zod";
import { NetworkLinkSchema } from "./computer";

/**
 * Phone content model (the 2010 smartphone era). Contacts and their SMS are
 * fictional scripts, like Messenger's: nothing generates text. The phone's
 * radios are data too, so a transfer is timed on 3G or on Wi-Fi by the same
 * `transferTimeMs` as every other machine.
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected an ISO date (YYYY-MM-DD)");

export const PhoneContactSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** 1-2 characters drawn as the avatar. */
  initial: z.string().min(1).max(2),
});

export const SmsOpeningSchema = z.object({
  text: z.string().min(1),
  /** When the SMS arrives, in ms since the phone was switched on. */
  afterMs: z.number().int().nonnegative(),
});

export const SmsThreadSchema = z.object({
  contactId: z.string().min(1),
  /** SMS the contact sends on their own. */
  openings: z.array(SmsOpeningSchema),
  /** The contact's answers, one per SMS the user sends, in order; then silence. */
  replies: z.array(z.string().min(1)),
  /** How long an answer takes to arrive after the user's SMS, in ms. */
  replyDelayMs: z.number().int().positive(),
});

/** One radio the phone can use for data. */
export const PhoneRadioSchema = z.object({
  id: z.enum(["mobile", "wifi"]),
  label: z.string().min(1),
  link: NetworkLinkSchema,
  /** True when the bytes count against the monthly data allowance. */
  metered: z.boolean(),
  sourceIds: z.array(z.string()),
  needsResearch: z.boolean().optional(),
});

export const StoreAppSchema = z.object({
  /** Also the id of the component that runs it once installed. */
  id: z.string().min(1),
  title: z.string().min(1),
  icon: z.string().min(1),
  description: z.string().min(1),
  sizeKb: z.number().int().positive(),
  /** Price shown in the store, in euro cents; 0 = free. Fictional apps, fictional prices. */
  priceCents: z.number().int().nonnegative(),
  availableFrom: isoDate,
});

export const PhonePhotoSchema = z.object({
  /** Sensor resolution in pixels. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /** Typical JPEG weight of one shot, in Ko. */
  sizeKb: z.number().int().positive(),
  /** Weight once reduced for an MMS, in Ko. */
  mmsSizeKb: z.number().int().positive(),
});

export const PhoneDataSchema = z.object({
  contacts: z.array(PhoneContactSchema).min(1),
  threads: z.array(SmsThreadSchema),
  radios: z.array(PhoneRadioSchema).min(1),
  store: z.array(StoreAppSchema),
  photo: PhonePhotoSchema,
  /** Monthly mobile-data allowance of the (fictional) plan, in Mo. */
  dataAllowanceMb: z.number().int().positive(),
  sourceIds: z.array(z.string()),
});

export type PhoneContact = z.infer<typeof PhoneContactSchema>;
export type SmsOpening = z.infer<typeof SmsOpeningSchema>;
export type SmsThread = z.infer<typeof SmsThreadSchema>;
export type PhoneRadio = z.infer<typeof PhoneRadioSchema>;
export type StoreApp = z.infer<typeof StoreAppSchema>;
export type PhonePhoto = z.infer<typeof PhonePhotoSchema>;
export type PhoneData = z.infer<typeof PhoneDataSchema>;
