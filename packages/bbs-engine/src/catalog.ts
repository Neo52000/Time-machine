import { BbsBoardSchema, SourceReferenceSchema, type BbsBoard } from "@time-machine/content-schema";

export interface BbsData {
  boards: unknown[];
  sources: unknown[];
}

export interface BbsCatalog {
  boards: BbsBoard[];
  getBoard(id: string): BbsBoard | undefined;
  /** Boards a caller could dial at a date (ISO), in phone-book order. */
  boardsAt(date: string): BbsBoard[];
}

/** Validates every board and its areas (fail fast), like every other catalogue. */
export function createBbsCatalog(data: BbsData): BbsCatalog {
  const boards = data.boards.map((b) => BbsBoardSchema.parse(b));
  const sourceIds = new Set(data.sources.map((s) => SourceReferenceSchema.parse(s).id));
  const byId = new Map<string, BbsBoard>();

  for (const board of boards) {
    if (byId.has(board.id)) throw new Error(`Duplicate BBS id "${board.id}"`);
    byId.set(board.id, board);
    if (board.rightsStatus === "unknown") {
      throw new Error(`BBS ${board.id} cannot be published with unknown rights`);
    }
    for (const id of board.sourceIds) {
      if (!sourceIds.has(id)) throw new Error(`BBS ${board.id} references unknown source "${id}"`);
    }
    const keys = new Set<string>();
    for (const area of board.areas) {
      if (keys.has(area.key)) throw new Error(`BBS ${board.id}: menu key "${area.key}" used twice`);
      keys.add(area.key);
      for (const item of area.items) {
        if (area.kind === "files" && (!item.filename || !item.sizeKb)) {
          throw new Error(`BBS ${board.id}: file "${item.id}" needs a filename and a size`);
        }
      }
    }
  }

  return {
    boards,
    getBoard: (id) => byId.get(id),
    boardsAt: (date) => boards.filter((b) => b.availableFrom <= date),
  };
}
