import type { VideotexColor } from "@time-machine/content-schema";

/** Videotex text mode: 40 columns × 25 rows (row 0 is the status line). */
export const COLS = 40;
export const ROWS = 25;

export interface ScreenLine {
  text: string;
  color: VideotexColor;
  inverse: boolean;
  /**
   * Semi-graphic row: one 6-bit mask per column (bit 0 top-left, 1 top-right,
   * 2 middle-left, 3 middle-right, 4 bottom-left, 5 bottom-right). `text`
   * then holds blanks so the row still reads as 40 columns.
   */
  mosaic?: number[];
  /** Text alternative, carried by the first row of a mosaic picture. */
  alt?: string;
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

/**
 * Packs "#"/"." pixel art into mosaic rows: every 2×3 pixel block becomes
 * one cell mask. Art narrower than 80 px is centred; the height is padded to
 * a multiple of 3 with dark pixels.
 */
export function mosaicRows(pixels: readonly string[]): number[][] {
  const width = Math.max(...pixels.map((p) => p.length));
  if (width > COLS * 2) throw new Error(`Mosaic is ${width} px wide, max ${COLS * 2}`);
  const leftPad = Math.floor((COLS * 2 - width) / 2);
  const leftCells = Math.floor(leftPad / 2);
  const grid = pixels.map((row) => row.padEnd(width, "."));
  while (grid.length % 3 !== 0) grid.push(".".repeat(width));
  const lit = (x: number, y: number) => grid[y]?.[x - leftCells * 2] === "#";

  const rows: number[][] = [];
  for (let y = 0; y < grid.length; y += 3) {
    const cells: number[] = [];
    for (let c = 0; c < COLS; c += 1) {
      const x = c * 2;
      let mask = 0;
      if (lit(x, y)) mask |= 1;
      if (lit(x + 1, y)) mask |= 2;
      if (lit(x, y + 1)) mask |= 4;
      if (lit(x + 1, y + 1)) mask |= 8;
      if (lit(x, y + 2)) mask |= 16;
      if (lit(x + 1, y + 2)) mask |= 32;
      cells.push(mask);
    }
    rows.push(cells);
  }
  return rows;
}
