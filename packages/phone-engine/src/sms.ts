import type { PhoneCatalog } from "./catalog";

// ---------------------------------------------------------------------------
// Counting: why an SMS holds 160 characters — or only 70.

/**
 * GSM 03.38 default alphabet: 128 characters packed on 7 bits, so 140 bytes
 * carry 160 of them. Anything outside it (ê, ç, œ, a curly apostrophe…)
 * switches the whole message to UCS-2, 16 bits per character: 70 per SMS.
 */
const GSM7_BASIC = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);
/** Extension table: reachable through an escape, so each costs two septets. */
const GSM7_EXTENSION = new Set("\f^{}\\[~]|€");

export type SmsEncoding = "gsm7" | "ucs2";

export interface SmsCount {
  encoding: SmsEncoding;
  /** Septets (GSM-7) or UTF-16 code units (UCS-2) the text costs. */
  units: number;
  /** SMS the network will actually carry (0 for an empty text). */
  segments: number;
  /** Capacity of one SMS at this size: 160/70 alone, 153/67 once split. */
  perSegment: number;
  /** Units left before one more SMS is needed. */
  remaining: number;
  /** First character that forced UCS-2, to show the user why. */
  culprit?: string;
}

const LIMITS: Record<SmsEncoding, { single: number; multi: number }> = {
  // A split message spends 6 bytes per SMS on the header that reassembles it.
  gsm7: { single: 160, multi: 153 },
  ucs2: { single: 70, multi: 67 },
};

/** Counts a text the way a 2010 phone's SMS counter did. */
export function countSms(text: string): SmsCount {
  let septets = 0;
  let culprit: string | undefined;
  for (const char of text) {
    if (GSM7_BASIC.has(char)) septets += 1;
    else if (GSM7_EXTENSION.has(char)) septets += 2;
    else {
      culprit = char;
      break;
    }
  }
  const encoding: SmsEncoding = culprit === undefined ? "gsm7" : "ucs2";
  const units = encoding === "gsm7" ? septets : text.length;
  const { single, multi } = LIMITS[encoding];
  const segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
  const perSegment = segments <= 1 ? single : multi;
  const capacity = Math.max(1, segments) * perSegment;
  return { encoding, units, segments, perSegment, remaining: capacity - units, culprit };
}

// ---------------------------------------------------------------------------
// Conversations: scripted, like Messenger, advanced by `tickSms`.

export interface Sms {
  id: string;
  contactId: string;
  from: "me" | "contact";
  text: string;
  /** Phone-clock ms at which it was sent or received. */
  atMs: number;
  /** SMS carried on the network (outgoing only; incoming arrive reassembled). */
  segments: number;
  read: boolean;
}

interface PendingReply {
  contactId: string;
  text: string;
  dueMs: number;
}

export interface SmsState {
  /** Ms since the phone was switched on. */
  elapsedMs: number;
  messages: Sms[];
  /** Openings already delivered, per contact. */
  openingsDone: Record<string, number>;
  /** Replies already used, per contact. */
  repliesUsed: Record<string, number>;
  pending: PendingReply[];
  nextId: number;
}

export function createSmsState(): SmsState {
  return {
    elapsedMs: 0,
    messages: [],
    openingsDone: {},
    repliesUsed: {},
    pending: [],
    nextId: 1,
  };
}

function deliver(state: SmsState, contactId: string, text: string, atMs: number): SmsState {
  const sms: Sms = {
    id: `sms-${state.nextId}`,
    contactId,
    from: "contact",
    text,
    atMs,
    segments: 1,
    read: false,
  };
  return { ...state, messages: [...state.messages, sms], nextId: state.nextId + 1 };
}

/** Advances the phone clock; delivers the openings and answers that fall due. */
export function tickSms(state: SmsState, catalog: PhoneCatalog, deltaMs: number): SmsState {
  let next: SmsState = { ...state, elapsedMs: state.elapsedMs + deltaMs };
  for (const thread of catalog.threads) {
    let done = next.openingsDone[thread.contactId] ?? 0;
    while (done < thread.openings.length && thread.openings[done]!.afterMs <= next.elapsedMs) {
      next = deliver(next, thread.contactId, thread.openings[done]!.text, next.elapsedMs);
      done += 1;
      next = { ...next, openingsDone: { ...next.openingsDone, [thread.contactId]: done } };
    }
  }
  const due = next.pending.filter((p) => p.dueMs <= next.elapsedMs);
  if (due.length > 0) {
    next = { ...next, pending: next.pending.filter((p) => p.dueMs > next.elapsedMs) };
    for (const p of due) next = deliver(next, p.contactId, p.text, next.elapsedMs);
  }
  return next;
}

/** A message the story makes a contact send (arrives now). */
export function receiveSms(state: SmsState, contactId: string, text: string): SmsState {
  return deliver(state, contactId, text, state.elapsedMs);
}

/**
 * The user sends an SMS. Blank text is refused (returns the same state). The
 * contact's next scripted answer, if any is left, is scheduled.
 */
export function sendSms(
  state: SmsState,
  catalog: PhoneCatalog,
  contactId: string,
  text: string,
): SmsState {
  if (text.trim() === "" || !catalog.getContact(contactId)) return state;
  const sms: Sms = {
    id: `sms-${state.nextId}`,
    contactId,
    from: "me",
    text,
    atMs: state.elapsedMs,
    segments: countSms(text).segments,
    read: true,
  };
  let next: SmsState = { ...state, messages: [...state.messages, sms], nextId: state.nextId + 1 };
  const thread = catalog.threadOf(contactId);
  const used = next.repliesUsed[contactId] ?? 0;
  if (thread && used < thread.replies.length) {
    next = {
      ...next,
      repliesUsed: { ...next.repliesUsed, [contactId]: used + 1 },
      pending: [
        ...next.pending,
        { contactId, text: thread.replies[used]!, dueMs: next.elapsedMs + thread.replyDelayMs },
      ],
    };
  }
  return next;
}

export function markRead(state: SmsState, contactId: string): SmsState {
  if (!state.messages.some((m) => m.contactId === contactId && !m.read)) return state;
  return {
    ...state,
    messages: state.messages.map((m) => (m.contactId === contactId ? { ...m, read: true } : m)),
  };
}

export function unreadCount(state: SmsState, contactId?: string): number {
  return state.messages.filter((m) => !m.read && (!contactId || m.contactId === contactId)).length;
}

export function threadMessages(state: SmsState, contactId: string): Sms[] {
  return state.messages.filter((m) => m.contactId === contactId);
}
