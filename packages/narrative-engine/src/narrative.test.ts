import { describe, expect, it } from "vitest";
import { listEras } from "@time-machine/era-engine";
import {
  createNarrativeCatalog,
  createNarrativeState,
  dispatch,
  interpolate,
  narrativeCatalog,
  type NarrativeEvent,
  type NarrativeState,
} from "./index";

const notify = (title: string) => ({
  type: "show.notification",
  payload: { title, body: "…" },
});

function run(triggers: unknown[], events: NarrativeEvent[]) {
  const catalog = createNarrativeCatalog({ triggers });
  let state: NarrativeState = createNarrativeState();
  const fired: string[][] = [];
  for (const event of events) {
    const result = dispatch(catalog.triggers, state, event);
    state = result.state;
    fired.push(result.fired);
  }
  return { state, fired };
}

describe("narrative catalogue", () => {
  it("loads the shipped triggers, each scoped to a real era", () => {
    const eraIds = new Set(listEras().map((e) => e.id));
    expect(narrativeCatalog.triggers.length).toBeGreaterThan(0);
    for (const t of narrativeCatalog.triggers) {
      for (const eraId of t.eras ?? []) expect(eraIds, `${t.id} → ${eraId}`).toContain(eraId);
    }
  });

  it("scopes triggers per era", () => {
    const catalog = createNarrativeCatalog({
      triggers: [
        {
          id: "a",
          eras: ["1998"],
          when: [{ event: "era.loaded" }],
          actions: [notify("A")],
          once: true,
        },
        { id: "b", when: [{ event: "era.loaded" }], actions: [notify("B")], once: true },
      ],
    });
    expect(catalog.forEra("1998").map((t) => t.id)).toEqual(["a", "b"]);
    expect(catalog.forEra("2005").map((t) => t.id)).toEqual(["b"]);
  });

  it("refuses events nobody emits and actions nobody performs", () => {
    expect(() =>
      createNarrativeCatalog({
        triggers: [
          { id: "x", when: [{ event: "time.changed" }], actions: [notify("X")], once: true },
        ],
      }),
    ).toThrow(/nothing emits/);
    expect(() =>
      createNarrativeCatalog({
        triggers: [
          {
            id: "x",
            when: [{ event: "era.loaded" }],
            actions: [{ type: "unlock.era", payload: { eraId: "2005" } }],
            once: true,
          },
        ],
      }),
    ).toThrow(/nothing performs/);
  });

  it("refuses duplicate ids, orphan flags and malformed payloads", () => {
    const t = { id: "x", when: [{ event: "era.loaded" }], actions: [notify("X")], once: true };
    expect(() => createNarrativeCatalog({ triggers: [t, t] })).toThrow(/Duplicate/);
    expect(() =>
      createNarrativeCatalog({ triggers: [{ ...t, requiresFlags: ["ghost"] }] }),
    ).toThrow(/no trigger sets/);
    expect(() =>
      createNarrativeCatalog({
        triggers: [{ ...t, actions: [{ type: "create.file", payload: { path: "relative.txt" } }] }],
      }),
    ).toThrow();
  });
});

describe("dispatch", () => {
  it("fires a once-trigger a single time", () => {
    const { fired } = run(
      [{ id: "hello", when: [{ event: "era.loaded" }], actions: [notify("Hi")], once: true }],
      [{ type: "era.loaded" }, { type: "era.loaded" }],
    );
    expect(fired).toEqual([["hello"], []]);
  });

  it("re-arms a repeatable trigger after it fires", () => {
    const { fired } = run(
      [
        {
          id: "every-404",
          when: [{ event: "site.visited", match: { type: "not-found" } }],
          actions: [notify("404")],
          once: false,
        },
      ],
      [
        { type: "site.visited", data: { type: "not-found" } },
        { type: "site.visited", data: { type: "reconstruction" } },
        { type: "site.visited", data: { type: "not-found" } },
      ],
    );
    expect(fired).toEqual([["every-404"], [], ["every-404"]]);
  });

  it("accumulates conditions across events, in any order", () => {
    const trigger = {
      id: "explorer",
      when: [{ event: "search.executed" }, { event: "file.opened" }],
      actions: [notify("Explorer")],
      once: true,
    };
    const { fired } = run(
      [trigger],
      [{ type: "file.opened", data: { path: "/a.txt" } }, { type: "search.executed" }],
    );
    expect(fired).toEqual([[], ["explorer"]]);
  });

  it("matches strings trimmed and case-insensitively, other scalars strictly", () => {
    const { fired } = run(
      [
        {
          id: "zero",
          when: [{ event: "search.executed", match: { query: "napster", results: 0 } }],
          actions: [notify("0")],
          once: false,
        },
      ],
      [
        { type: "search.executed", data: { query: "  NAPSTER ", results: 0 } },
        { type: "search.executed", data: { query: "napster", results: "0" } },
      ],
    );
    expect(fired).toEqual([["zero"], []]);
  });

  it("lets a flag set in one dispatch release a dependent trigger immediately", () => {
    const { fired, state } = run(
      [
        // Declared first on purpose: evaluation must loop, not depend on order.
        {
          id: "second",
          when: [{ event: "era.loaded" }],
          requiresFlags: ["ready"],
          actions: [notify("2")],
          once: true,
        },
        {
          id: "first",
          when: [{ event: "era.loaded" }],
          actions: [{ type: "set.flag", payload: { flag: "ready" } }],
          once: true,
        },
      ],
      [{ type: "era.loaded" }],
    );
    expect(fired).toEqual([["first", "second"]]);
    expect(state.flags).toEqual(["ready"]);
  });

  it("fills placeholders from the firing event and never mutates the input state", () => {
    const catalog = createNarrativeCatalog({
      triggers: [
        {
          id: "log",
          when: [{ event: "site.visited" }],
          actions: [
            {
              type: "create.file",
              payload: { path: "/Mes Documents/log.txt", content: "Visite : {domain} {missing}" },
            },
          ],
          once: true,
        },
      ],
    });
    const initial = createNarrativeState();
    const result = dispatch(catalog.triggers, initial, {
      type: "site.visited",
      data: { domain: "altavista.com" },
    });
    expect(result.actions).toEqual([
      {
        type: "create.file",
        payload: { path: "/Mes Documents/log.txt", content: "Visite : altavista.com {missing}" },
      },
    ]);
    expect(initial).toEqual(createNarrativeState());
  });

  it("interpolates only word keys", () => {
    expect(interpolate("{a}-{b c}", { a: 1 })).toBe("1-{b c}");
  });
});
