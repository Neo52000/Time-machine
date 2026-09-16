"use client";

import { useEffect, useState } from "react";
import { bootTimeline, type BootSequence } from "@time-machine/desktop-engine";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  sequence: BootSequence;
  /** `skipped` is true when the visitor clicked or pressed a key instead of waiting. */
  onDone: (skipped: boolean) => void;
}

/** All lines land at once under reduced motion, so leave time to read them. */
const REDUCED_MOTION_HOLD_MS = 1200;

/**
 * Replays a data-driven boot sequence; click or any key skips it. Under
 * "reduce motion" the lines appear at once and only the final hold remains.
 */
export function BootScreen({ sequence, onDone }: Props) {
  const reducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleCount(sequence.lines.length);
      const timer = setTimeout(
        () => onDone(false),
        Math.max(sequence.holdMs, REDUCED_MOTION_HOLD_MS),
      );
      return () => clearTimeout(timer);
    }
    const timeline = bootTimeline(sequence);
    const timers = timeline.map((t, index) => setTimeout(() => setVisibleCount(index + 1), t));
    const total = (timeline.at(-1) ?? 0) + sequence.holdMs;
    timers.push(setTimeout(() => onDone(false), total));
    return () => timers.forEach(clearTimeout);
  }, [sequence, onDone, reducedMotion]);

  useEffect(() => {
    const skip = () => onDone(true);
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  return (
    <div
      className="tm-boot"
      data-testid="boot-screen"
      data-reduced-motion={reducedMotion}
      onClick={() => onDone(true)}
      role="button"
      tabIndex={0}
      aria-label="Démarrage de la machine — cliquer ou appuyer sur une touche pour passer"
    >
      {sequence.lines.slice(0, visibleCount).map((line, i) => (
        <div key={i}>{line.text || " "}</div>
      ))}
      <span className="tm-boot-cursor" />
    </div>
  );
}
