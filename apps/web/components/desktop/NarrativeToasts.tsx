"use client";

import { useEffect } from "react";
import { useNarrative, type NarrativeNotification } from "@/lib/narrative/NarrativeProvider";

const AUTO_DISMISS_MS = 8000;

function Toast({
  notification,
  dismiss,
}: {
  notification: NarrativeNotification;
  dismiss: (id: number) => void;
}) {
  const { id } = notification;
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [id, dismiss]);

  return (
    <div className="tm-toast tm-bevel" data-testid="narrative-notification">
      <div className="tm-toast-head">
        <strong>{notification.title}</strong>
        <button
          type="button"
          className="tm-toast-close"
          aria-label={`Fermer la notification « ${notification.title} »`}
          onClick={() => dismiss(id)}
        >
          ×
        </button>
      </div>
      <p>{notification.body}</p>
    </div>
  );
}

/** In-era notification balloons raised by the Narrative Engine; a polite live region. */
export function NarrativeToasts() {
  const { notifications, dismiss } = useNarrative();
  return (
    <div className="tm-toasts" role="status" aria-live="polite" data-testid="narrative-toasts">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} dismiss={dismiss} />
      ))}
    </div>
  );
}
