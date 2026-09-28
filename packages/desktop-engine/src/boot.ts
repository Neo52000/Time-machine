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
      // Brand-neutral, and consistent with the pc-1998 profile (content/machines).
      { text: "Time Machine BIOS v4.5 - Configuration 1998", delayMs: 0 },
      { text: "(C) Time Machine. Tous droits reserves.", delayMs: 60 },
      { text: "", delayMs: 300 },
      { text: "Processeur x86 a 266 MHz", delayMs: 200 },
      { text: "Test memoire :  32768K OK", delayMs: 500 },
      { text: "", delayMs: 100 },
      { text: "Disque maitre primaire ... 4 Go", delayMs: 400 },
      { text: "Disque esclave secondaire ... lecteur CD-ROM", delayMs: 350 },
      { text: "", delayMs: 100 },
      { text: "Starting Time Machine OS 98...", delayMs: 500 },
    ],
  },
  "pc-1992-boot": {
    id: "pc-1992-boot",
    holdMs: 700,
    lines: [
      { text: "Time Machine BIOS v2.1 - Configuration 1992", delayMs: 0 },
      { text: "Processeur x86 a 33 MHz", delayMs: 250 },
      { text: "Test memoire :  4096K OK", delayMs: 600 },
      { text: "Disque dur ... 120 Mo", delayMs: 350 },
      { text: "Carte graphique VGA 640x480, 16 couleurs", delayMs: 250 },
      { text: "Modem 14400 bit/s detecte sur COM2", delayMs: 300 },
      { text: "", delayMs: 100 },
      { text: "C:\\> TMDOS", delayMs: 400 },
      { text: "Chargement de l'environnement graphique...", delayMs: 500 },
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
      { text: "Connexion ADSL établie — 2 Mbit/s", delayMs: 600 },
    ],
  },
  "phone-2010-boot": {
    id: "phone-2010-boot",
    holdMs: 500,
    lines: [
      { text: "Time Machine Mobile 2", delayMs: 0 },
      { text: "Code PIN accepté", delayMs: 500 },
      { text: "Recherche du réseau...", delayMs: 400 },
      { text: "TM Mobile — 3G+", delayMs: 700 },
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
