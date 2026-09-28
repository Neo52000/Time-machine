import { describe, expect, it } from "vitest";
import {
  OFFLINE,
  bbsCatalog,
  connected,
  createBbsCatalog,
  dial,
  render,
  submit,
  type BbsSession,
} from "./index";

const text = (state: BbsSession) =>
  render(state, bbsCatalog, { connectBps: 14400 })
    .map((l) => l.text)
    .join("\n");

function loggedIn(): BbsSession {
  const state = connected(dial("grenier"));
  return submit(state, bbsCatalog, "Voyageur").state;
}

describe("BBS catalogue", () => {
  it("loads the fictional boards, each dated and sourced", () => {
    expect(bbsCatalog.boards.length).toBeGreaterThanOrEqual(3);
    for (const board of bbsCatalog.boards) expect(board.fictional).toBe(true);
    expect(bbsCatalog.boardsAt("1989-01-01")).toHaveLength(0);
    expect(bbsCatalog.boardsAt("1992-06-01").map((b) => b.id)).toContain("grenier");
  });

  it("refuses files without a size, duplicate keys and unknown rights", () => {
    const board = structuredClone(bbsCatalog.getBoard("grenier")!) as Record<string, unknown>;
    const sources = [{ id: "src-timemachine-bbs-fiction", label: "x" }];
    const files = (board.areas as { kind: string; items: Record<string, unknown>[] }[]).find(
      (a) => a.kind === "files",
    )!;
    delete files.items[0]!.sizeKb;
    expect(() => createBbsCatalog({ boards: [board], sources })).toThrow(/needs a filename/);

    const dup = structuredClone(bbsCatalog.getBoard("grenier")!);
    dup.areas[1]!.key = dup.areas[0]!.key;
    expect(() => createBbsCatalog({ boards: [dup], sources })).toThrow(/used twice/);

    const unknown = { ...bbsCatalog.getBoard("grenier")!, rightsStatus: "unknown" };
    expect(() => createBbsCatalog({ boards: [unknown], sources })).toThrow(/unknown rights/);
  });
});

describe("BBS session", () => {
  it("dials, shows the banner with the modem speed, and asks for a handle", () => {
    const dialing = dial("grenier");
    expect(text(dialing)).toContain("ATDT 100000192");
    const login = connected(dialing);
    expect(login.phase).toBe("login");
    expect(text(login)).toContain("CONNECT 14400");
    expect(text(login)).toContain("Sysop : Castor");
  });

  it("refuses a bad handle, then greets a good one", () => {
    const login = connected(dial("grenier"));
    const bad = submit(login, bbsCatalog, "x");
    expect(bad.state.phase).toBe("login");
    expect(bad.state.message).toMatch(/Pseudo/);
    const good = submit(login, bbsCatalog, " Voyageur ");
    expect(good.state).toMatchObject({ phase: "menu", handle: "Voyageur" });
    expect(good.effects.map((e) => e.type)).toEqual(["logged-in"]);
    expect(text(good.state)).toContain("bonjour Voyageur");
  });

  it("walks menu → area → message and back, case-insensitively", () => {
    const area = submit(loggedIn(), bbsCatalog, "f");
    expect(area.state.phase).toBe("area");
    expect(area.effects[0]).toMatchObject({ type: "opened-area", area: { kind: "messages" } });
    const message = submit(area.state, bbsCatalog, "2");
    expect(text(message.state)).toContain("World Wide Web");
    expect(submit(message.state, bbsCatalog, "T").state.message).toBe("Q pour revenir.");
    const back = submit(submit(message.state, bbsCatalog, "q").state, bbsCatalog, "Q");
    expect(back.state.phase).toBe("menu");
  });

  it("offers downloads in file areas only", () => {
    const files = submit(loggedIn(), bbsCatalog, "T").state;
    expect(text(files)).toMatch(/LABYR\.ZIP\s+48 Ko/);
    const item = submit(files, bbsCatalog, "1").state;
    const download = submit(item, bbsCatalog, "t");
    expect(download.effects).toEqual([
      expect.objectContaining({
        type: "download",
        item: expect.objectContaining({ filename: "LABYR.ZIP" }),
      }),
    ]);
  });

  it("rejects unknown commands and out-of-range numbers, and G hangs up", () => {
    const menu = loggedIn();
    expect(submit(menu, bbsCatalog, "Z").state.message).toMatch(/Commande inconnue/);
    const files = submit(menu, bbsCatalog, "T").state;
    expect(submit(files, bbsCatalog, "99").state.message).toMatch(/entre 1 et 3/);
    const bye = submit(menu, bbsCatalog, "g");
    expect(bye.state).toEqual(OFFLINE);
    expect(bye.effects).toEqual([{ type: "hangup" }]);
  });

  it("clips every line to 80 columns", () => {
    for (const line of render(loggedIn(), bbsCatalog))
      expect(line.text.length).toBeLessThanOrEqual(80);
  });
});
