import { describe, expect, it } from "vitest";
import {
  MAX_PENDING,
  containsPersonalData,
  createAnalyticsState,
  createSessionId,
  flush,
  record,
  setConsent,
  summarize,
} from "./state";

const base = () => createAnalyticsState({ sessionId: "s1" });

describe("session id", () => {
  it("is deterministic for injected randomness and 16 chars long", () => {
    expect(createSessionId(() => 0)).toBe("aaaaaaaaaaaaaaaa");
    expect(createSessionId(() => 0.999)).toBe("9999999999999999");
    expect(createSessionId()).toHaveLength(16);
  });
});

describe("record", () => {
  it("buffers while consent is unknown, capped at MAX_PENDING", () => {
    let s = base();
    for (let i = 0; i < MAX_PENDING + 3; i += 1) s = record(s, "app.opened", { appId: "x" }, i);
    expect(s.pending).toHaveLength(MAX_PENDING);
    expect(s.pending[0]!.at).toBe(3);
    expect(s.dropped).toBe(3);
    expect(s.queue).toEqual([]);
  });

  it("queues once granted and drops once denied", () => {
    const granted = record(setConsent(base(), "granted"), "era.selected", { eraId: "1998" }, 10);
    expect(granted.queue).toEqual([
      { name: "era.selected", at: 10, sessionId: "s1", props: { eraId: "1998" } },
    ]);
    const denied = record(setConsent(base(), "denied"), "era.selected", { eraId: "1998" }, 10);
    expect(denied.queue).toEqual([]);
    expect(denied.dropped).toBe(1);
  });

  it("refuses an unknown event name or a structured prop", () => {
    const s = setConsent(base(), "granted");
    // @ts-expect-error — unknown names are a type error and a runtime drop
    expect(record(s, "made.up", {}, 1).dropped).toBe(1);
    // @ts-expect-error — nested objects cannot be props
    expect(record(s, "app.opened", { nested: { a: 1 } }, 1).dropped).toBe(1);
  });

  it("refuses anything that looks personal", () => {
    expect(containsPersonalData({ email: "x" })).toBe(true);
    expect(containsPersonalData({ userName: "x" })).toBe(true);
    expect(containsPersonalData({ note: "contact me at a@b.fr" })).toBe(true);
    expect(containsPersonalData({ appId: "browser", count: 2, ok: true })).toBe(false);
    const s = record(setConsent(base(), "granted"), "app.opened", { email: "a@b.fr" }, 1);
    expect(s.queue).toEqual([]);
    expect(s.dropped).toBe(1);
  });
});

describe("consent transitions", () => {
  it("releases the buffer on grant and discards it on denial", () => {
    const buffered = record(record(base(), "app.opened", { appId: "a" }, 1), "app.opened", {}, 2);
    const granted = setConsent(buffered, "granted");
    expect(granted.queue.map((e) => e.at)).toEqual([1, 2]);
    expect(granted.pending).toEqual([]);

    const denied = setConsent(buffered, "denied");
    expect(denied.queue).toEqual([]);
    expect(denied.pending).toEqual([]);
    expect(denied.dropped).toBe(2);
  });

  it("is a no-op for the same consent", () => {
    const s = base();
    expect(setConsent(s, "unknown")).toBe(s);
  });
});

describe("flush", () => {
  it("only yields batches when granted, in order, up to max", () => {
    let s = setConsent(base(), "granted");
    for (let i = 0; i < 5; i += 1) s = record(s, "app.opened", { i }, i);
    const first = flush(s, 3);
    expect(first.batch.map((e) => e.at)).toEqual([0, 1, 2]);
    const second = flush(first.state, 3);
    expect(second.batch.map((e) => e.at)).toEqual([3, 4]);
    expect(flush(second.state).batch).toEqual([]);

    const unknown = record(base(), "app.opened", {}, 1);
    expect(flush(unknown).batch).toEqual([]);
  });
});

describe("summarize", () => {
  it("counts events by name", () => {
    let s = setConsent(base(), "granted");
    s = record(s, "app.opened", {}, 1);
    s = record(s, "app.opened", {}, 2);
    s = record(s, "media.played", {}, 3);
    expect(summarize(s.queue)).toEqual({ "app.opened": 2, "media.played": 1 });
  });
});
