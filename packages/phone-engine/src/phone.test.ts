import { describe, expect, it } from "vitest";
import {
  allowanceUsed,
  countSms,
  createPhoneCatalog,
  createSmsState,
  createSnake,
  markRead,
  phoneCatalog,
  receiveSms,
  sendSms,
  stepSnake,
  threadMessages,
  tickSms,
  transferCost,
  turn,
  unreadCount,
  type SnakeState,
} from "./index";

describe("countSms", () => {
  it("fits 160 GSM-7 characters in one SMS, then splits by 153", () => {
    expect(countSms("")).toMatchObject({ segments: 0, remaining: 160 });
    expect(countSms("a".repeat(160))).toMatchObject({
      encoding: "gsm7",
      segments: 1,
      remaining: 0,
    });
    expect(countSms("a".repeat(161))).toMatchObject({
      segments: 2,
      perSegment: 153,
      remaining: 145,
    });
    expect(countSms("a".repeat(307)).segments).toBe(3);
  });

  it("keeps é, è, à and ù in GSM-7", () => {
    expect(countSms("Déjà là, où ça ? très bien").encoding).toBe("ucs2"); // ç is not in the table
    expect(countSms("Déjà là, où es-tu ? très bien").encoding).toBe("gsm7");
  });

  it("drops to 70 characters as soon as one ê appears, and names the culprit", () => {
    const count = countSms(`${"a".repeat(60)} fête`);
    expect(count).toMatchObject({ encoding: "ucs2", units: 65, segments: 1, remaining: 5 });
    expect(count.culprit).toBe("ê");
    expect(countSms(`${"a".repeat(71)}ê`)).toMatchObject({ segments: 2, perSegment: 67 });
  });

  it("charges the extension table (€, [, ]) two septets", () => {
    expect(countSms("5€").units).toBe(3);
    expect(countSms(`${"a".repeat(159)}€`).segments).toBe(2);
  });

  it("treats a curly apostrophe as UCS-2", () => {
    expect(countSms("J’arrive").encoding).toBe("ucs2");
    expect(countSms("J'arrive").encoding).toBe("gsm7");
  });
});

describe("SMS conversations", () => {
  const catalog = createPhoneCatalog({
    phone: {
      sourceIds: ["s"],
      dataAllowanceMb: 500,
      contacts: [
        { id: "lea", name: "Léa", initial: "L" },
        { id: "max", name: "Max", initial: "M" },
      ],
      threads: [
        {
          contactId: "lea",
          replyDelayMs: 1000,
          openings: [{ text: "Coucou", afterMs: 500 }],
          replies: ["Réponse 1", "Réponse 2"],
        },
      ],
      radios: [
        {
          id: "mobile",
          label: "3G",
          metered: true,
          sourceIds: [],
          link: { kind: "mobile", label: "3G", downstreamBps: 1, upstreamBps: 1, latencyMs: 0 },
        },
      ],
      store: [],
      photo: { width: 1, height: 1, sizeKb: 1, mmsSizeKb: 1 },
    },
    sources: [{ id: "s", label: "Source", kind: "primary" }],
  });

  it("delivers openings when they fall due, unread", () => {
    let s = tickSms(createSmsState(), catalog, 400);
    expect(s.messages).toHaveLength(0);
    s = tickSms(s, catalog, 200);
    expect(threadMessages(s, "lea").map((m) => m.text)).toEqual(["Coucou"]);
    expect(unreadCount(s)).toBe(1);
    s = markRead(s, "lea");
    expect(unreadCount(s)).toBe(0);
    expect(tickSms(s, catalog, 10_000).messages).toHaveLength(1);
  });

  it("answers each SMS with the next scripted reply, then falls silent", () => {
    let s = createSmsState();
    for (let i = 0; i < 3; i++) {
      s = sendSms(s, catalog, "lea", `message ${i}`);
      s = tickSms(s, catalog, 1000);
    }
    const lea = threadMessages(s, "lea");
    expect(lea.filter((m) => m.from === "contact").map((m) => m.text)).toEqual([
      "Coucou",
      "Réponse 1",
      "Réponse 2",
    ]);
    expect(lea.filter((m) => m.from === "me")).toHaveLength(3);
  });

  it("records how many SMS a long message costs, and refuses a blank one", () => {
    const s = sendSms(createSmsState(), catalog, "max", "a".repeat(200));
    expect(s.messages[0]).toMatchObject({ from: "me", segments: 2 });
    expect(sendSms(s, catalog, "max", "   ")).toBe(s);
    expect(sendSms(s, catalog, "ghost", "hello")).toBe(s);
  });

  it("delivers story messages immediately", () => {
    const s = receiveSms(createSmsState(), "max", "Salut");
    expect(threadMessages(s, "max")[0]).toMatchObject({ from: "contact", read: false });
  });

  it("fails fast on a thread for an unknown contact or an unknown source", () => {
    const base = {
      sourceIds: [],
      dataAllowanceMb: 1,
      contacts: [{ id: "a", name: "A", initial: "A" }],
      threads: [],
      radios: [
        {
          id: "mobile",
          label: "3G",
          metered: true,
          sourceIds: [],
          link: { kind: "mobile", label: "3G", downstreamBps: 1, upstreamBps: 1, latencyMs: 0 },
        },
      ],
      store: [],
      photo: { width: 1, height: 1, sizeKb: 1, mmsSizeKb: 1 },
    };
    expect(() =>
      createPhoneCatalog({
        phone: {
          ...base,
          threads: [{ contactId: "b", replyDelayMs: 1, openings: [], replies: [] }],
        },
        sources: [],
      }),
    ).toThrow(/unknown contact "b"/);
    expect(() =>
      createPhoneCatalog({ phone: { ...base, sourceIds: ["ghost"] }, sources: [] }),
    ).toThrow(/unknown source "ghost"/);
  });
});

describe("Serpentin", () => {
  const always = (value: number) => () => value;

  it("moves, eats, grows and scores", () => {
    let s = createSnake(8, 8, always(0));
    s = { ...s, food: { x: 3, y: 4 } };
    s = stepSnake(s, always(0));
    expect(s.score).toBe(1);
    expect(s.body).toHaveLength(4);
    expect(s.body[0]).toEqual({ x: 3, y: 4 });
    s = stepSnake(s, always(0));
    expect(s.body).toHaveLength(4);
  });

  it("ignores a U-turn and dies on the wall", () => {
    let s: SnakeState = createSnake(5, 5, always(0.99));
    s = turn(s, "left");
    expect(s.queued).toBe("right");
    s = turn(s, "up");
    s = stepSnake(s);
    s = stepSnake(s);
    expect(s.over).toBe(false);
    s = stepSnake(s);
    expect(s.over).toBe(true);
    expect(stepSnake(s)).toBe(s);
  });

  it("dies biting itself", () => {
    let s = createSnake(8, 8, always(0));
    s = {
      ...s,
      body: [
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 4 },
        { x: 4, y: 3 },
        { x: 4, y: 2 },
      ],
      direction: "up",
      queued: "right",
      food: { x: 0, y: 0 },
    };
    expect(stepSnake(s).over).toBe(true);
  });
});

describe("transfers on the phone's radios", () => {
  const mobile = phoneCatalog.getRadio("mobile");
  const wifi = phoneCatalog.getRadio("wifi");

  it("sends a full photo far faster on Wi-Fi, and only 3G eats the allowance", () => {
    const size = phoneCatalog.photo.sizeKb;
    const onMobile = transferCost(size, mobile, "up");
    const onWifi = transferCost(size, wifi, "up");
    expect(onMobile.realMs).toBeGreaterThan(onWifi.realMs * 2);
    expect(onMobile.meteredBytes).toBe(size * 1024);
    expect(onWifi.meteredBytes).toBe(0);
  });

  it("reports the allowance", () => {
    expect(allowanceUsed(250 * 1024 * 1024, 500)).toMatchObject({ usedMb: 250, ratio: 0.5 });
    expect(allowanceUsed(600 * 1024 * 1024, 500)).toMatchObject({ ratio: 1, exhausted: true });
  });
});

describe("shipped phone content", () => {
  it("has a store open in 2010 and threads for every scripted contact", () => {
    expect(phoneCatalog.storeAt("2010-01-01").map((a) => a.id)).toEqual(["torch", "serpentin"]);
    expect(phoneCatalog.storeAt("2008-01-01")).toEqual([]);
    for (const thread of phoneCatalog.threads) {
      expect(phoneCatalog.getContact(thread.contactId)).toBeDefined();
    }
  });
});
