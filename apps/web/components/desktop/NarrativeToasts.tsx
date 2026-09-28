"use client";

import { useEffect } from "react";
import { useNarrative, type NarrativeNotification } from "@/lib/narrative/NarrativeProvider";

const AUTO_DISMISS_MS = 8000;

function Toast({
  notification,
  dismiss,
  dismissAfterMs,
}: {
  notification: NarrativeNotification;
  dismiss: (id: number) => void;
  dismissAfterMs: number;
}) {
  const { id } = notification;
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(id), dismissAfterMs);
    return () => window.clearTimeout(timer);
  }, [id, dismiss, dismissAfterMs]);

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

/**
 * In-era notification balloons raised by the Narrative Engine; a polite live
 * region. `limit` drops the oldest balloon when a new one would exceed it
 * (a phone screen has room for two banners, not a stack).
 */
export function NarrativeToasts({
  limit = Infinity,
  dismissAfterMs = AUTO_DISMISS_MS,
}: {
  limit?: number;
  dismissAfterMs?: number;
}) {
  const { notifications, dismiss } = useNarrative();
  useEffect(() => {
    if (notifications.length > limit) dismiss(notifications[0]!.id);
  }, [notifications, limit, dismiss]);
  return (
    <div className="tm-toasts" role="status" aria-live="polite" data-testid="narrative-toasts">
      {notifications.map((n) => (
        <Toast key={n.id} notification={n} dismiss={dismiss} dismissAfterMs={dismissAfterMs} />
      ))}
    </div>
  );
}
