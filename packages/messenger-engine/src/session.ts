import type { ContactStatus, MessengerContact } from "@time-machine/content-schema";
import type { MessengerCatalog } from "./catalog";

/**
 * Messenger session — pure state, advanced by `tick(deltaMs)`. Two clocks
 * run: a global one (since the session started, driving background presence
 * changes) and one per open conversation (since it was opened, driving its
 * scripted reveal). The UI owns the real `setInterval`/timers and calls
 * `tick`, so the reveal logic is fully unit-tested without waiting on
 * anything.
 */
export interface ContactState {
  status: ContactStatus;
  statusMessage?: string;
}

export interface ConversationRuntime {
  /** Elapsed ms since this conversation was opened. */
  elapsedMs: number;
  /** How many of the script's messages are currently revealed. */
  revealedCount: number;
  /** True while the contact's next message is being "typed". */
  contactTyping: boolean;
}

export interface SessionState {
  /** Elapsed ms since the session started; drives background presence events. */
  elapsedMs: number;
  contactStates: Record<string, ContactState>;
  activeConversationId: string | null;
  runtimes: Record<string, ConversationRuntime>;
  /** Messages the user sent, appended immediately, keyed by conversation id. */
  sentMessages: Record<string, { id: string; text: string; atMs: number }[]>;
}

export function createSession(catalog: MessengerCatalog): SessionState {
  const contactStates: Record<string, ContactState> = {};
  for (const contact of catalog.contacts) {
    contactStates[contact.id] = { status: contact.status, statusMessage: contact.statusMessage };
  }
  return {
    elapsedMs: 0,
    contactStates,
    activeConversationId: null,
    runtimes: {},
    sentMessages: {},
  };
}

export function openConversation(state: SessionState, conversationId: string): SessionState {
  if (state.runtimes[conversationId]) {
    return { ...state, activeConversationId: conversationId };
  }
  return {
    ...state,
    activeConversationId: conversationId,
    runtimes: {
      ...state.runtimes,
      [conversationId]: { elapsedMs: 0, revealedCount: 0, contactTyping: false },
    },
  };
}

export function closeConversation(state: SessionState): SessionState {
  return { ...state, activeConversationId: null };
}

function cumulativeDelays(catalog: MessengerCatalog, conversationId: string): number[] {
  const conversation = catalog.getConversation(conversationId);
  if (!conversation) return [];
  let sum = 0;
  return conversation.messages.map((m) => {
    sum += m.delayMs;
    return sum;
  });
}

function applyPresence(
  contactStates: SessionState["contactStates"],
  catalog: MessengerCatalog,
  elapsedMs: number,
): SessionState["contactStates"] {
  let next = contactStates;
  for (const contact of catalog.contacts) {
    const due = catalog.presenceEventsOf(contact.id).filter((e) => e.afterMs <= elapsedMs);
    if (due.length === 0) continue;
    const latest = due[due.length - 1]!;
    const current = next[contact.id];
    if (
      !current ||
      current.status !== latest.status ||
      current.statusMessage !== latest.statusMessage
    ) {
      next = {
        ...next,
        [contact.id]: { status: latest.status, statusMessage: latest.statusMessage },
      };
    }
  }
  return next;
}

/** Advance the global clock (background presence) and every open conversation's script. */
export function tick(
  state: SessionState,
  catalog: MessengerCatalog,
  deltaMs: number,
): SessionState {
  const elapsedMs = state.elapsedMs + deltaMs;
  const contactStates = applyPresence(state.contactStates, catalog, elapsedMs);

  let runtimes = state.runtimes;
  for (const [conversationId, runtime] of Object.entries(state.runtimes)) {
    const conversation = catalog.getConversation(conversationId);
    if (!conversation) continue;
    const convElapsedMs = runtime.elapsedMs + deltaMs;
    const cumulative = cumulativeDelays(catalog, conversationId);
    let revealedCount = runtime.revealedCount;
    while (
      revealedCount < conversation.messages.length &&
      convElapsedMs >= (cumulative[revealedCount] ?? Infinity)
    ) {
      revealedCount += 1;
    }
    const upcoming = conversation.messages[revealedCount];
    const upcomingDueAt = cumulative[revealedCount] ?? Infinity;
    const typingMs = upcoming?.from === "contact" ? (upcoming.typingMs ?? 0) : 0;
    const contactTyping =
      upcoming?.from === "contact" && typingMs > 0 && convElapsedMs >= upcomingDueAt - typingMs;

    if (
      revealedCount !== runtime.revealedCount ||
      convElapsedMs !== runtime.elapsedMs ||
      contactTyping !== runtime.contactTyping
    ) {
      runtimes = {
        ...runtimes,
        [conversationId]: { elapsedMs: convElapsedMs, revealedCount, contactTyping },
      };
    }
  }

  if (
    contactStates === state.contactStates &&
    runtimes === state.runtimes &&
    elapsedMs === state.elapsedMs
  ) {
    return state;
  }
  return { ...state, elapsedMs, contactStates, runtimes };
}

export function sendMessage(
  state: SessionState,
  conversationId: string,
  text: string,
): SessionState {
  const trimmed = text.trim();
  if (!trimmed) return state;
  const runtime = state.runtimes[conversationId];
  const id = `sent-${(state.sentMessages[conversationId]?.length ?? 0) + 1}`;
  const entry = { id, text: trimmed, atMs: runtime?.elapsedMs ?? 0 };
  return {
    ...state,
    sentMessages: {
      ...state.sentMessages,
      [conversationId]: [...(state.sentMessages[conversationId] ?? []), entry],
    },
  };
}

export function contactOf(
  catalog: MessengerCatalog,
  contactId: string,
  state: SessionState,
): MessengerContact & ContactState {
  const contact = catalog.getContact(contactId)!;
  const current = state.contactStates[contactId] ?? {
    status: contact.status,
    statusMessage: contact.statusMessage,
  };
  return { ...contact, ...current };
}
