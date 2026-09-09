import type { VideotexColor } from "@time-machine/content-schema";

/** Videotex text mode: 40 columns × 25 rows (row 0 is the status line). */
export const COLS = 40;
export const ROWS = 25;

export interface ScreenLine {
  text: string;
  color: VideotexColor;
  inverse: boolean;
}

export type Screen = ScreenLine[];

export function line(text: string, color: VideotexColor = "white", inverse = false): ScreenLine {
  return { text: fit(text), color, inverse };
}

/** Clip or pad to exactly COLS characters. */
export function fit(text: string): string {
  return text.length >= COLS ? text.slice(0, COLS) : text.padEnd(COLS, " ");
}

export function center(text: string): string {
  const clipped = text.slice(0, COLS);
  const left = Math.floor((COLS - clipped.length) / 2);
  return fit(" ".repeat(left) + clipped);
}

/** Word-wrap a paragraph into lines of at most COLS characters. */
export function wrap(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= COLS) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word.length > COLS ? word.slice(0, COLS) : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Strip accents and uppercase, the way a Minitel keyboard "hears" input. */
export function videotexInput(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
}
