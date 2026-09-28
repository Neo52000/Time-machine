import type { BbsArea, BbsBoard, BbsColor, BbsItem } from "@time-machine/content-schema";
import type { BbsCatalog } from "./catalog";

/**
 * BBS session — a pure state machine, like the Minitel's. The UI owns the
 * modem (it dials, waits for the handshake, then calls `connected`) and
 * performs the effects `submit` returns (hang up, save a download).
 */
export type BbsPhase = "offline" | "dialing" | "login" | "menu" | "area" | "item";

export interface BbsSession {
  phase: BbsPhase;
  boardId?: string;
  handle?: string;
  areaId?: string;
  itemId?: string;
  /** One-line feedback (refused input), cleared by the next valid command. */
  message?: string;
}

export type BbsEffect =
  | { type: "hangup" }
  | { type: "logged-in"; board: BbsBoard }
  | { type: "opened-area"; board: BbsBoard; area: BbsArea }
  | { type: "download"; board: BbsBoard; item: BbsItem };

export interface BbsResult {
  state: BbsSession;
  effects: BbsEffect[];
}

export const OFFLINE: BbsSession = { phase: "offline" };

export function dial(boardId: string): BbsSession {
  return { phase: "dialing", boardId };
}

/** The modem handshake finished: the board asks for a handle. */
export function connected(state: BbsSession): BbsSession {
  return state.phase === "dialing" ? { phase: "login", boardId: state.boardId } : state;
}

const HANDLE = /^[A-Za-z0-9_-]{2,12}$/;

function boardOf(state: BbsSession, catalog: BbsCatalog): BbsBoard | undefined {
  return state.boardId ? catalog.getBoard(state.boardId) : undefined;
}

function areaOf(state: BbsSession, board: BbsBoard): BbsArea | undefined {
  return board.areas.find((a) => a.id === state.areaId);
}

/** Handles one line typed by the caller (Enter). */
export function submit(state: BbsSession, catalog: BbsCatalog, raw: string): BbsResult {
  const input = raw.trim();
  const command = input.toUpperCase();
  const board = boardOf(state, catalog);
  const stay = (message: string): BbsResult => ({ state: { ...state, message }, effects: [] });
  if (!board) return { state, effects: [] };

  switch (state.phase) {
    case "login": {
      if (!HANDLE.test(input)) return stay("Pseudo : 2 à 12 lettres, chiffres, - ou _.");
      return {
        state: { phase: "menu", boardId: board.id, handle: input },
        effects: [{ type: "logged-in", board }],
      };
    }
    case "menu": {
      if (command === "G") return { state: OFFLINE, effects: [{ type: "hangup" }] };
      const area = board.areas.find((a) => a.key === command);
      if (!area) return stay(`Commande inconnue : ${input || "(vide)"}`);
      return {
        state: { ...state, phase: "area", areaId: area.id, message: undefined },
        effects: [{ type: "opened-area", board, area }],
      };
    }
    case "area": {
      const area = areaOf(state, board);
      if (!area) return { state, effects: [] };
      if (command === "Q")
        return {
          state: { ...state, phase: "menu", areaId: undefined, message: undefined },
          effects: [],
        };
      const index = Number.parseInt(command, 10);
      const item = Number.isInteger(index) ? area.items[index - 1] : undefined;
      if (!item) return stay(`Choisissez un numéro entre 1 et ${area.items.length}, ou Q.`);
      return {
        state: { ...state, phase: "item", itemId: item.id, message: undefined },
        effects: [],
      };
    }
    case "item": {
      const area = areaOf(state, board);
      const item = area?.items.find((i) => i.id === state.itemId);
      if (!area || !item) return { state, effects: [] };
      if (command === "Q")
        return {
          state: { ...state, phase: "area", itemId: undefined, message: undefined },
          effects: [],
        };
      if (command === "T" && area.kind === "files") {
        return {
          state: { ...state, message: undefined },
          effects: [{ type: "download", board, item }],
        };
      }
      return stay(
        area.kind === "files" ? "T pour télécharger, Q pour revenir." : "Q pour revenir.",
      );
    }
    default:
      return { state, effects: [] };
  }
}

// ---------------------------------------------------------------------------
// Rendering: an 80-column text screen, coloured per line.

export const BBS_COLS = 80;

export interface BbsLine {
  text: string;
  color: BbsColor;
}

const l = (text: string, color: BbsColor = "gray"): BbsLine => ({
  text: text.slice(0, BBS_COLS),
  color,
});

function itemLabel(area: BbsArea, item: BbsItem, n: number): string {
  if (area.kind === "files") {
    return `${String(n).padStart(2)}. ${item.filename!.padEnd(12)} ${String(item.sizeKb).padStart(5)} Ko  ${item.title}`;
  }
  return `${String(n).padStart(2)}. ${item.title}${item.author ? ` — ${item.author}` : ""}`;
}

export interface RenderOptions {
  /** Line speed announced by the modem on connection, e.g. 14400. */
  connectBps?: number;
  /** Describes a file's download time on the caller's modem. */
  transferLabel?: (item: BbsItem) => string;
}

/** The screen for the current state. */
export function render(
  state: BbsSession,
  catalog: BbsCatalog,
  options: RenderOptions = {},
): BbsLine[] {
  const transferLabel = options.transferLabel ?? (() => "");
  const board = boardOf(state, catalog);
  const lines: BbsLine[] = [];
  switch (state.phase) {
    case "offline":
      lines.push(l("TERMINAL BBS — hors ligne", "cyan"), l(""));
      lines.push(l("Choisissez un serveur dans l'annuaire, à gauche, pour l'appeler."));
      lines.push(l("Le modem compose le numéro : la ligne téléphonique est alors occupée."));
      break;
    case "dialing":
      lines.push(
        l(`ATDT ${board?.phone.replace(/\D/g, "") ?? ""}`, "yellow"),
        l(""),
        l("Numérotation...", "gray"),
      );
      break;
    case "login":
      if (!board) break;
      lines.push(
        l(options.connectBps ? `CONNECT ${options.connectBps}` : "CONNECT", "green"),
        l(""),
      );
      for (const b of board.banner) lines.push(l(b, board.bannerColor ?? "cyan"));
      lines.push(l(""), l(board.tagline, "white"), l(`Sysop : ${board.sysop}`, "gray"), l(""));
      lines.push(l("Entrez votre pseudo puis Entrée :", "yellow"));
      break;
    case "menu":
      if (!board) break;
      lines.push(l(`${board.name} — bonjour ${state.handle} !`, "cyan"), l(""));
      lines.push(l("MENU PRINCIPAL", "white"));
      for (const area of board.areas) {
        lines.push(l(`  [${area.key}] ${area.title} (${area.items.length})`, "yellow"));
      }
      lines.push(l("  [G] Au revoir (raccrocher)", "yellow"));
      break;
    case "area": {
      const area = board && areaOf(state, board);
      if (!area) break;
      lines.push(l(area.title.toUpperCase(), "cyan"), l(""));
      area.items.forEach((item, i) => lines.push(l(itemLabel(area, item, i + 1), "white")));
      lines.push(l(""), l("Numéro puis Entrée pour lire, Q pour revenir au menu.", "yellow"));
      break;
    }
    case "item": {
      const area = board && areaOf(state, board);
      const item = area?.items.find((i) => i.id === state.itemId);
      if (!area || !item) break;
      lines.push(l(item.title, "cyan"));
      if (item.author || item.date) {
        lines.push(
          l([item.author && `De : ${item.author}`, item.date].filter(Boolean).join("   "), "gray"),
        );
      }
      lines.push(l("-".repeat(40), "blue"));
      for (const text of item.body) lines.push(l(text, "white"));
      lines.push(l(""));
      if (area.kind === "files") {
        lines.push(
          l(`${item.filename} — ${item.sizeKb} Ko ${transferLabel(item)}`.trim(), "green"),
        );
        lines.push(l("T pour télécharger, Q pour revenir.", "yellow"));
      } else {
        lines.push(l("Q pour revenir.", "yellow"));
      }
      break;
    }
  }
  if (state.message) lines.push(l(""), l(state.message, "red"));
  return lines;
}
