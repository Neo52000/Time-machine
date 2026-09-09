"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { ContactStatus } from "@time-machine/content-schema";
import {
  contactOf,
  createSession,
  messengerCatalog,
  openConversation,
  sendMessage,
  tick,
  type SessionState,
} from "@time-machine/messenger-engine";
import type { AppProps } from "./types";
import "./messenger.css";

const TICK_MS = 200;

const STATUS_LABEL: Record<ContactStatus, string> = {
  online: "en ligne",
  away: "absent",
  busy: "occupé",
  offline: "hors ligne",
};

/**
 * 2005-style instant messenger. Contacts and their scripted conversation
 * are pure data (@time-machine/messenger-engine); this component only
 * owns the real timer, calling `tick` every TICK_MS so messages, typing
 * indicators and background presence changes reveal themselves.
 */
export function MessengerApp(_props: AppProps) {
  const catalog = messengerCatalog;
  const [session, setSession] = useState<SessionState>(() => createSession(catalog));
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSession((s) => tick(s, catalog, TICK_MS)), TICK_MS);
    return () => clearInterval(id);
  }, [catalog]);

  const activeConversation = session.activeConversationId
    ? catalog.getConversation(session.activeConversationId)
    : undefined;
  const activeContact = activeConversation
    ? contactOf(catalog, activeConversation.contactId, session)
    : undefined;
  const runtime = session.activeConversationId
    ? session.runtimes[session.activeConversationId]
    : undefined;

  const timeline = useMemo(() => {
    if (!activeConversation || !runtime) return [];
    const scripted = activeConversation.messages.slice(0, runtime.revealedCount).map((m) => ({
      key: m.id,
      from: m.from,
      text: m.text,
    }));
    const sent = (session.sentMessages[activeConversation.id] ?? []).map((m) => ({
      key: m.id,
      from: "me" as const,
      text: m.text,
    }));
    // Interleave roughly by keeping scripted order and appending sent messages at the end
    // of the segment they were typed in — good enough for a demo conversation.
    return [...scripted, ...sent];
  }, [activeConversation, runtime, session.sentMessages]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [timeline.length, runtime?.contactTyping]);

  const openChat = useCallback(
    (contactId: string) => {
      const conversation = catalog.getConversation(
        catalog.conversationOfContact(contactId)?.id ?? "",
      );
      if (!conversation) return;
      setSession((s) => openConversation(s, conversation.id));
    },
    [catalog],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activeConversation) return;
    setSession((s) => sendMessage(s, activeConversation.id, input));
    setInput("");
  }

  return (
    <div className="msn-root">
      <div className="msn-contacts" data-testid="messenger-contacts">
        <div className="msn-panel-title">Contacts</div>
        {catalog.contacts.map((contact) => {
          const state = contactOf(catalog, contact.id, session);
          const hasChat = Boolean(catalog.conversationOfContact(contact.id));
          return (
            <button
              key={contact.id}
              type="button"
              className="msn-contact"
              data-testid={`contact-${contact.id}`}
              disabled={!hasChat}
              onClick={() => openChat(contact.id)}
              aria-pressed={activeContact?.id === contact.id}
            >
              <span className={`msn-dot msn-dot-${state.status}`} aria-hidden />
              <span className="msn-avatar">{contact.avatarInitial}</span>
              <span className="msn-contact-info">
                <span className="msn-contact-name">{contact.name}</span>
                <span className="msn-contact-status">
                  {STATUS_LABEL[state.status]}
                  {state.statusMessage ? ` — ${state.statusMessage}` : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="msn-chat">
        {activeConversation && activeContact ? (
          <>
            <div className="msn-chat-header">
              <span className={`msn-dot msn-dot-${activeContact.status}`} aria-hidden />
              {activeContact.name}
            </div>
            <div className="msn-log" ref={logRef} data-testid="messenger-log">
              {timeline.map((m) => (
                <div
                  key={m.key}
                  className={`msn-line msn-line-${m.from}`}
                  data-testid={`message-${m.key}`}
                >
                  <span className="msn-line-author">
                    {m.from === "me" ? "Moi" : activeContact.name} :
                  </span>{" "}
                  {m.text}
                </div>
              ))}
              {runtime?.contactTyping && (
                <div className="msn-typing" data-testid="messenger-typing">
                  {activeContact.name} est en train d&apos;écrire…
                </div>
              )}
            </div>
            <form onSubmit={onSubmit} className="msn-composer">
              <input
                className="msn-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrire un message…"
                aria-label="Écrire un message"
                data-testid="messenger-input"
              />
              <button type="submit" className="msn-send" data-testid="messenger-send">
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="msn-empty">Choisissez un contact pour ouvrir une conversation.</div>
        )}
      </div>
    </div>
  );
}
