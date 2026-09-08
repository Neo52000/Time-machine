/**
 * Boot experience — resolves an `EraManifest.machine.bootSequence` key into
 * the lines shown while the machine "starts". Timing is data, so the UI
 * only replays it; nothing era-specific lives in components.
 */
export interface BootLine {
  text: string;
  /** Delay before this line appears, in ms (relative to the previous line). */
  delayMs: number;
}

export interface BootSequence {
  id: string;
  lines: BootLine[];
  /** Pause after the last line before the desktop appears. */
  holdMs: number;
}

const sequences: Record<string, BootSequence> = {
  "pc-1998-boot": {
    id: "pc-1998-boot",
    holdMs: 700,
    lines: [
      { text: "Award Modular BIOS v4.51PG, An Energy Star Ally", delayMs: 0 },
      { text: "Copyright (C) 1984-98, Award Software, Inc.", delayMs: 60 },
      { text: "", delayMs: 300 },
      { text: "Pentium II 300MHz CPU at 300MHz", delayMs: 200 },
      { text: "Memory Test :  65536K OK", delayMs: 500 },
      { text: "", delayMs: 100 },
      { text: "Detecting IDE Primary Master ... QUANTUM FIREBALL SE4.3A", delayMs: 400 },
      { text: "Detecting IDE Secondary Master ... CD-ROM 24X", delayMs: 350 },
      { text: "", delayMs: 100 },
      { text: "Starting Time Machine OS 98...", delayMs: 500 },
    ],
  },
  "minitel-boot": {
    id: "minitel-boot",
    holdMs: 600,
    lines: [
      { text: "MINITEL 1B", delayMs: 0 },
      { text: "Connexion 3615 ...", delayMs: 500 },
      { text: "CONNEXION ETABLIE", delayMs: 900 },
    ],
  },
  "pc-2005-boot": {
    id: "pc-2005-boot",
    holdMs: 500,
    lines: [
      { text: "Time Machine OS 2005", delayMs: 0 },
      { text: "Chargement des paramètres personnels...", delayMs: 500 },
      { text: "Connexion ADSL établie — 8 Mbit/s", delayMs: 600 },
    ],
  },
};

const fallbackSequence: BootSequence = {
  id: "generic-boot",
  holdMs: 400,
  lines: [
    { text: "Time Machine", delayMs: 0 },
    { text: "Démarrage...", delayMs: 300 },
  ],
};

export function getBootSequence(key: string): BootSequence {
  return sequences[key] ?? { ...fallbackSequence, id: key };
}

/** Total time from first line to desktop, in ms. */
export function bootDurationMs(sequence: BootSequence): number {
  return sequence.lines.reduce((sum, line) => sum + line.delayMs, 0) + sequence.holdMs;
}

/** Cumulative timestamps (ms) at which each line becomes visible. */
export function bootTimeline(sequence: BootSequence): number[] {
  let t = 0;
  return sequence.lines.map((line) => {
    t += line.delayMs;
    return t;
  });
}
