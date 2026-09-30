import {
  PhoneDataSchema,
  SourceReferenceSchema,
  type PhoneContact,
  type PhoneData,
  type PhoneRadio,
  type SmsThread,
  type StoreApp,
} from "@time-machine/content-schema";

export interface PhoneCatalogData {
  phone: unknown;
  sources: unknown[];
}

export interface PhoneCatalog extends PhoneData {
  getContact(id: string): PhoneContact | undefined;
  threadOf(contactId: string): SmsThread | undefined;
  getRadio(id: PhoneRadio["id"]): PhoneRadio;
  getStoreApp(id: string): StoreApp | undefined;
  /** Apps the store lists at a date (ISO), in catalogue order. */
  storeAt(date: string): StoreApp[];
}

function unique<T>(items: T[], key: (item: T) => string, what: string): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    const id = key(item);
    if (map.has(id)) throw new Error(`Duplicate ${what} "${id}"`);
    map.set(id, item);
  }
  return map;
}

/** Validates the phone content (fail fast): contacts, threads, radios, store, sources. */
export function createPhoneCatalog(data: PhoneCatalogData): PhoneCatalog {
  const phone = PhoneDataSchema.parse(data.phone);
  const sourceIds = new Set(data.sources.map((s) => SourceReferenceSchema.parse(s).id));
  const contacts = unique(phone.contacts, (c) => c.id, "phone contact");
  const threads = unique(phone.threads, (t) => t.contactId, "SMS thread for contact");
  const radios = unique(phone.radios, (r) => r.id, "radio");
  const store = unique(phone.store, (a) => a.id, "store app");

  for (const thread of phone.threads) {
    if (!contacts.has(thread.contactId)) {
      throw new Error(`SMS thread references unknown contact "${thread.contactId}"`);
    }
  }
  if (!radios.has("mobile")) throw new Error('The phone needs a "mobile" radio');
  const cited = [...phone.sourceIds, ...phone.radios.flatMap((r) => r.sourceIds)];
  for (const id of cited) {
    if (!sourceIds.has(id)) throw new Error(`Phone content references unknown source "${id}"`);
  }

  return {
    ...phone,
    getContact: (id) => contacts.get(id),
    threadOf: (contactId) => threads.get(contactId),
    getRadio: (id) => radios.get(id) ?? radios.get("mobile")!,
    getStoreApp: (id) => store.get(id),
    storeAt: (date) => phone.store.filter((a) => a.availableFrom <= date),
  };
}
