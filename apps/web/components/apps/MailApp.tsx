"use client";

import { useState } from "react";
import { getMailbox } from "@time-machine/desktop-engine";
import { useNetworkConnection } from "@/lib/useNetworkConnection";
import type { AppProps } from "./types";

export function MailApp({ era }: AppProps) {
  const mailbox = getMailbox(era.id);
  const [selectedId, setSelectedId] = useState<string | null>(mailbox.messages[0]?.id ?? null);
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(mailbox.messages[0] ? [mailbox.messages[0].id] : []),
  );
  const selected = mailbox.messages.find((m) => m.id === selectedId);
  const { connection, connect } = useNetworkConnection(era);
  const [fetched, setFetched] = useState(false);

  function select(id: string) {
    setSelectedId(id);
    setReadIds((prev) => new Set(prev).add(id));
  }

  return (
    <div className="flex h-full flex-col">
      <div className="tm-toolbar flex items-center gap-2 px-2 py-1 text-xs">
        <span className="font-bold">{mailbox.address}</span>
        <span className="text-[var(--tm-text-muted)]">
          — {mailbox.messages.length - readIds.size} non lu(s)
        </span>
        <button
          type="button"
          className="tm-btn ml-auto"
          data-testid="mail-fetch"
          onClick={() => {
            connect(); // a dial-up machine has to call its provider first
            setFetched(true);
          }}
        >
          Relever le courrier
        </button>
        {fetched && (
          <span role="status" data-testid="mail-status">
            {connection.phase === "dialing"
              ? "Connexion au serveur de courrier…"
              : "Aucun nouveau message."}
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1">
        <ul
          className="tm-app-body w-2/5 overflow-auto border-r"
          style={{ borderColor: "var(--tm-surface-dark)" }}
        >
          {mailbox.messages.map((m) => {
            const active = m.id === selectedId;
            const unread = !readIds.has(m.id);
            return (
              <li key={m.id}>
                <button
                  type="button"
                  data-testid={`mail-${m.id}`}
                  onClick={() => select(m.id)}
                  className="block w-full px-2 py-1 text-left text-xs"
                  style={
                    active
                      ? { background: "var(--tm-selection)", color: "var(--tm-title-text)" }
                      : undefined
                  }
                >
                  <div className={unread ? "font-bold" : ""}>{m.subject}</div>
                  <div className="truncate opacity-75">{m.from}</div>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="tm-app-body flex-1 overflow-auto p-3 text-sm">
          {selected ? (
            <>
              <div
                className="border-b pb-2 text-xs"
                style={{ borderColor: "var(--tm-surface-dark)" }}
              >
                <div>
                  <span className="font-bold">De :</span> {selected.from}
                </div>
                <div>
                  <span className="font-bold">Date :</span> {selected.date}
                </div>
                <div>
                  <span className="font-bold">Objet :</span> {selected.subject}
                </div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap font-sans">{selected.body}</pre>
            </>
          ) : (
            <p className="text-[var(--tm-text-muted)]">Aucun message sélectionné.</p>
          )}
        </div>
      </div>
    </div>
  );
}
