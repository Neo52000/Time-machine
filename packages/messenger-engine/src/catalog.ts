import {
  MessengerContactSchema,
  MessengerConversationSchema,
  PresenceEventSchema,
  type MessengerContact,
  type MessengerConversation,
  type PresenceEvent,
} from "@time-machine/content-schema";

export interface MessengerData {
  contacts: unknown[];
  conversations: unknown[];
  presenceEvents: unknown[];
}

export interface MessengerCatalog {
  contacts: MessengerContact[];
  conversations: MessengerConversation[];
  presenceEvents: PresenceEvent[];
  getContact(id: string): MessengerContact | undefined;
  getConversation(id: string): MessengerConversation | undefined;
  conversationOfContact(contactId: string): MessengerConversation | undefined;
  presenceEventsOf(contactId: string): PresenceEvent[];
}

/** Validates every record and checks referential integrity (fail fast). */
export function createMessengerCatalog(data: MessengerData): MessengerCatalog {
  const contacts = data.contacts.map((c) => MessengerContactSchema.parse(c));
  const conversations = data.conversations.map((c) => MessengerConversationSchema.parse(c));
  const presenceEvents = data.presenceEvents.map((p) => PresenceEventSchema.parse(p));

  const contactById = new Map<string, MessengerContact>();
  for (const c of contacts) {
    if (contactById.has(c.id)) throw new Error(`Duplicate contact id "${c.id}"`);
    contactById.set(c.id, c);
  }
  const conversationById = new Map<string, MessengerConversation>();
  const conversationByContact = new Map<string, MessengerConversation>();
  for (const c of conversations) {
    if (conversationById.has(c.id)) throw new Error(`Duplicate conversation id "${c.id}"`);
    conversationById.set(c.id, c);
    if (!contactById.has(c.contactId)) {
      throw new Error(`conversation ${c.id} references unknown contact "${c.contactId}"`);
    }
    if (conversationByContact.has(c.contactId)) {
      throw new Error(`contact "${c.contactId}" has more than one conversation`);
    }
    conversationByContact.set(c.contactId, c);
  }
  for (const p of presenceEvents) {
    if (!contactById.has(p.contactId)) {
      throw new Error(`presence event references unknown contact "${p.contactId}"`);
    }
  }

  return {
    contacts,
    conversations,
    presenceEvents,
    getContact: (id) => contactById.get(id),
    getConversation: (id) => conversationById.get(id),
    conversationOfContact: (contactId) => conversationByContact.get(contactId),
    presenceEventsOf: (contactId) =>
      presenceEvents.filter((p) => p.contactId === contactId).sort((a, b) => a.afterMs - b.afterMs),
  };
}
