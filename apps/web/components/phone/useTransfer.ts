"use client";

import { useEffect, useRef, useState } from "react";

/** Transfers play faster than real time, and say so: 38 s of 3G become 3,8 s. */
export const TRANSFER_SPEEDUP = 10;

export interface Transfer {
  key: string;
  realMs: number;
  progress: number;
}

/**
 * One transfer at a time (a download, an upload), shown accelerated. `onDone`
 * runs once, when the bar reaches 100 %.
 */
export function useTransfer(onDone: (key: string) => void) {
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const startedAt = useRef(0);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!transfer || transfer.progress >= 1) return;
    const id = window.setInterval(() => {
      const progress = Math.min(
        1,
        ((Date.now() - startedAt.current) * TRANSFER_SPEEDUP) / transfer.realMs,
      );
      setTransfer((t) => (t ? { ...t, progress } : t));
      if (progress >= 1) done.current(transfer.key);
    }, 100);
    return () => window.clearInterval(id);
  }, [transfer]);

  const start = (key: string, realMs: number) => {
    startedAt.current = Date.now();
    setTransfer({ key, realMs, progress: 0 });
  };
  const busy = transfer !== null && transfer.progress < 1;
  return { transfer, start, busy, clear: () => setTransfer(null) };
}
