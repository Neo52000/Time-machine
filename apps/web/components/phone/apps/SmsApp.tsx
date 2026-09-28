"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  countSms,
  phoneCatalog,
  threadMessages,
  unreadCount,
  type SmsCount,
} from "@time-machine/phone-engine";
import { useAudio } from "@/lib/audio/AudioProvider";
import { useNarrative } from "@/lib/narrative/NarrativeProvider";
import { usePhoneStore } from "@/lib/phoneStore";
import type { PhoneAppProps } from "../types";

function CounterHint({ count }: { count: SmsCount }) {
  if (count.encoding === "gsm7") {
    return (
      <>
        {count.remaining} / {count.perSegment}
      </>
    );
  }
  return (
    <>
      {count.remaining} / {count.perSegment} — « {count.culprit} » hors alphabet SMS : 70 caractères
      par SMS
    </>
  );
}

function Conversation({ contactId }: { contactId: string }) {
  const contact = phoneCatalog.getContact(contactId)!;
  const sms = usePhoneStore((s) => s.sms);
  const messages = useMemo(() => threadMessages(sms, contactId), [sms, contactId]);
  const airplane = usePhoneStore((s) => s.airplane);
  const send = usePhoneStore((s) => s.send);
  const read = usePhoneStore((s) => s.read);
  const openThread = usePhoneStore((s) => s.openThread);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const audio = useAudio();
  const { emit } = useNarrative();
  const logRef = useRef<HTMLDivElement>(null);
  const count = countSms(text);

  useEffect(() => {
    read(contactId);
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages.length, contactId, read]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (text.trim() === "") return;
    if (airplane) {
      setError("Échec de l'envoi : mode avion activé.");
      audio.play("error");
      return;
    }
    setError(null);
    send(contactId, text);
    audio.play("sent");
    emit("service.opened", { kiosk: "sms", service: "sent" });
    if (count.segments > 1) emit("service.opened", { kiosk: "sms", service: "multipart" });
    setText("");
  }

  return (
    <div className="ph-sms-thread">
      <div className="ph-appbar">
        <button
          type="button"
          className="ph-back"
          onClick={() => openThread(null)}
          data-testid="sms-back"
        >
          ‹ Messages
        </button>
        <strong>{contact.name}</strong>
      </div>
      <div
        className="ph-sms-log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-label={`SMS avec ${contact.name}`}
        data-testid="sms-thread"
      >
        {messages.length === 0 && <p className="ph-muted">Aucun message.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`ph-bubble ph-bubble-${m.from}`} data-testid="sms-bubble">
            {m.text}
            {m.from === "me" && (
              <span className="ph-bubble-meta">
                Envoyé{m.segments > 1 ? ` · ${m.segments} SMS` : ""}
              </span>
            )}
          </div>
        ))}
      </div>
      <form className="ph-composer" onSubmit={onSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Écrire un SMS…"
          aria-label="Écrire un SMS"
          data-testid="sms-input"
        />
        <button type="submit" className="ph-send" data-testid="sms-send">
          Envoyer
        </button>
      </form>
      <div
        className={`ph-counter${count.encoding === "ucs2" ? " ph-counter-warn" : ""}`}
        data-testid="sms-counter"
        data-encoding={count.encoding}
        data-segments={count.segments}
        aria-live="polite"
      >
        {count.segments > 1 && <strong>{count.segments} SMS · </strong>}
        <CounterHint count={count} />
      </div>
      {error && (
        <p className="ph-error" role="alert" data-testid="sms-error">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Messages: SMS, 160 characters at a time — or 70, as soon as one character
 * falls outside the GSM alphabet. The counter shows it live, as phones did.
 */
export function SmsApp(_props: PhoneAppProps) {
  const thread = usePhoneStore((s) => s.thread);
  const openThread = usePhoneStore((s) => s.openThread);
  const sms = usePhoneStore((s) => s.sms);

  if (thread) return <Conversation contactId={thread} />;

  return (
    <div className="ph-list">
      <div className="ph-appbar">
        <strong>Messages</strong>
      </div>
      {phoneCatalog.contacts.map((contact) => {
        const last = threadMessages(sms, contact.id).at(-1);
        const unread = unreadCount(sms, contact.id);
        return (
          <button
            key={contact.id}
            type="button"
            className="ph-row"
            onClick={() => openThread(contact.id)}
            data-testid={`sms-contact-${contact.id}`}
          >
            <span className="ph-avatar" aria-hidden>
              {contact.initial}
            </span>
            <span className="ph-row-main">
              <span className="ph-row-title">
                {contact.name}
                {unread > 0 && <span className="ph-dot">{unread}</span>}
              </span>
              <span className="ph-row-sub">{last ? last.text : "Nouveau message"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
