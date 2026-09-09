import type { MinitelBlock, MinitelPage } from "@time-machine/content-schema";
import { COLS, ROWS, center, fit, line, wrap, type Screen, type ScreenLine } from "./screen";

/**
 * Lays a page out on the 40×25 grid. Row 0 is the status line (service +
 * page counter), rows 1..23 the body, row 24 the input/prompt line. Long
 * pages are split into screens reachable with SUITE / RETOUR.
 */
export const BODY_ROWS = ROWS - 2;

export interface LaidOutPage {
  /** Body screens (each ≤ BODY_ROWS lines). */
  screens: ScreenLine[][];
  /** Prompt shown on the last row when an input block exists. */
  prompt?: string;
}

function blockLines(block: MinitelBlock): ScreenLine[] {
  switch (block.type) {
    case "text": {
      const color = block.color ?? "white";
      const out: ScreenLine[] = [];
      for (const raw of block.lines) {
        // Lines that already fit keep their spacing (hand-aligned columns); longer ones wrap.
        const wrapped = raw.length <= COLS ? [raw] : wrap(raw);
        for (const w of wrapped) {
          out.push({
            text: block.align === "center" ? center(w) : fit(w),
            color,
            inverse: block.inverse ?? false,
          });
        }
      }
      return out;
    }
    case "blank":
      return Array.from({ length: block.rows ?? 1 }, () => line(""));
    case "rule":
      return [line("-".repeat(COLS), "blue")];
    case "menu":
      return block.items.map((item) => line(` ${item.key}  ${item.label}`, "yellow"));
    case "input":
      return [line(`${block.label} : ...`, "cyan")];
  }
}

export function layoutPage(page: MinitelPage): LaidOutPage {
  const lines: ScreenLine[] = [];
  for (const block of page.blocks) lines.push(...blockLines(block));

  const screens: ScreenLine[][] = [];
  for (let i = 0; i < Math.max(1, lines.length); i += BODY_ROWS) {
    screens.push(lines.slice(i, i + BODY_ROWS));
  }
  const input = page.blocks.find((b) => b.type === "input");
  return { screens, prompt: input ? `${input.label} :` : undefined };
}

/** Compose the final 25-row screen. */
export function composeScreen(options: {
  status: string;
  body: ScreenLine[];
  bottom: string;
  bottomColor?: ScreenLine["color"];
}): Screen {
  const body = [...options.body];
  while (body.length < BODY_ROWS) body.push(line(""));
  return [
    line(options.status, "white", true),
    ...body.slice(0, BODY_ROWS),
    line(options.bottom, options.bottomColor ?? "green"),
  ];
}
