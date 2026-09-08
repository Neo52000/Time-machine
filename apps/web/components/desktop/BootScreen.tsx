"use client";

import { useEffect, useState } from "react";
import { bootTimeline, type BootSequence } from "@time-machine/desktop-engine";

interface Props {
  sequence: BootSequence;
  onDone: () => void;
}

/** Replays a data-driven boot sequence; click or any key skips it. */
export function BootScreen({ sequence, onDone }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timeline = bootTimeline(sequence);
    const timers = timeline.map((t, index) => setTimeout(() => setVisibleCount(index + 1), t));
    const total = (timeline.at(-1) ?? 0) + sequence.holdMs;
    timers.push(setTimeout(onDone, total));
    return () => timers.forEach(clearTimeout);
  }, [sequence, onDone]);

  useEffect(() => {
    const skip = () => onDone();
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [onDone]);

  return (
    <div
      className="tm-boot"
      data-testid="boot-screen"
      onClick={onDone}
      role="button"
      tabIndex={0}
      aria-label="Démarrage de la machine — cliquer pour passer"
    >
      {sequence.lines.slice(0, visibleCount).map((line, i) => (
        <div key={i}>{line.text || " "}</div>
      ))}
      <span className="tm-boot-cursor" />
    </div>
  );
}
