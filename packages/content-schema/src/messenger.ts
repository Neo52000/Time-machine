import { z } from "zod";

/**
 * Instant-messenger content model. A conversation is a fixed script: the
 * contact's lines and their timing are data, replayed by the Messenger
 * Engine's session as the user opens the conversation. Nothing here
 * generates replies — it recreates the feel of a period IM client, not a
 * chatbot.
 */
export const ContactStatusSchema = z.enum(["online", "away", "busy", "offline"]);

export const MessengerContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  /** 1-2 characters shown as the avatar glyph. */
  avatarInitial: z.string().min(1).max(2),
  status: ContactStatusSchema,
  statusMessage: z.string().optional(),
});

export const MessengerMessageSchema = z.object({
  id: z.string(),
  from: z.enum(["me", "contact"]),
  text: z.string(),
  /** Delay after the previous reveal in this conversation, in ms. */
  delayMs: z.number().int().nonnegative(),
  /** "Is typing…" shown for this long right before a contact message reveals. */
  typingMs: z.number().int().nonnegative().optional(),
});

export const MessengerConversationSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  messages: z.array(MessengerMessageSchema).min(1),
});

/** A contact's status can change in the background (e.g. "Marc" signs in). */
export const PresenceEventSchema = z.object({
  contactId: z.string(),
  /** Elapsed ms since the messenger session started (not since any one conversation opened). */
  afterMs: z.number().int().nonnegative(),
  status: ContactStatusSchema,
  statusMessage: z.string().optional(),
});

export type ContactStatus = z.infer<typeof ContactStatusSchema>;
export type MessengerContact = z.infer<typeof MessengerContactSchema>;
export type MessengerMessage = z.infer<typeof MessengerMessageSchema>;
export type MessengerConversation = z.infer<typeof MessengerConversationSchema>;
export type PresenceEvent = z.infer<typeof PresenceEventSchema>;
