import { describe, expect, it } from "vitest";
import { createMessengerCatalog } from "./catalog";
import { messengerCatalog } from "./content";
import {
  closeConversation,
  contactOf,
  createSession,
  openConversation,
  sendMessage,
  tick,
} from "./session";

const cat = messengerCatalog;

describe("catalogue", () => {
  it("loads contacts and conversations with referential integrity", () => {
    expect(cat.contacts.map((c) => c.id)).toEqual(["julie", "marc", "famille", "servicemsn"]);
    expect(cat.conversationOfContact("julie")?.id).toBe("conv-julie");
    expect(cat.presenceEventsOf("marc")).toHaveLength(1);
  });

  it("rejects a conversation referencing an unknown contact", () => {
    expect(() =>
      createMessengerCatalog({
        contacts: cat.contacts,
        conversations: [
          {
            id: "x",
            contactId: "ghost",
            messages: [{ id: "m", from: "contact", text: "hi", delayMs: 0 }],
          },
        ],
        presenceEvents: [],
      }),
    ).toThrow(/unknown contact "ghost"/);
  });

  it("rejects two conversations for the same contact", () => {
    expect(() =>
      createMessengerCatalog({
        contacts: cat.contacts,
        conversations: [
          ...cat.conversations,
          { id: "conv-julie-2", contactId: "julie", messages: cat.conversations[0]!.messages },
        ],
        presenceEvents: [],
      }),
    ).toThrow(/more than one conversation/);
  });
});

describe("session", () => {
  it("starts with each contact's initial status", () => {
    const session = createSession(cat);
    expect(contactOf(cat, "julie", session).status).toBe("online");
    expect(contactOf(cat, "marc", session).status).toBe("offline");
  });

  it("reveals scripted messages over time and shows a typing indicator first", () => {
    let session = openConversation(createSession(cat), "conv-julie");
    // j1: delayMs 600, typingMs 500 → typing from t=100 to t=600.
    session = tick(session, cat, 200);
    expect(session.runtimes["conv-julie"]).toMatchObject({ revealedCount: 0, contactTyping: true });
    session = tick(session, cat, 400); // t=600
    expect(session.runtimes["conv-julie"]).toMatchObject({
      revealedCount: 1,
      contactTyping: false,
    });
  });

  it("reveals every message once enough time has passed, in order", () => {
    let session = openConversation(createSession(cat), "conv-julie");
    session = tick(session, cat, 20_000);
    const conversation = cat.getConversation("conv-julie")!;
    expect(session.runtimes["conv-julie"]?.revealedCount).toBe(conversation.messages.length);
  });

  it("advances multiple open conversations independently", () => {
    let session = openConversation(createSession(cat), "conv-julie");
    session = openConversation(session, "conv-servicemsn");
    session = tick(session, cat, 500);
    expect(session.runtimes["conv-servicemsn"]?.revealedCount).toBe(1); // s1 delay 400
    expect(session.runtimes["conv-julie"]?.revealedCount).toBe(0); // j1 delay 600
  });

  it("applies scripted presence changes for the open conversation's contact", () => {
    // Marc has no conversation of his own in the fixture set used here, but
    // the presence event still fires relative to any open conversation tick.
    let session = openConversation(createSession(cat), "conv-julie");
    expect(contactOf(cat, "marc", session).status).toBe("offline");
    session = tick(session, cat, 5000);
    expect(contactOf(cat, "marc", session)).toMatchObject({
      status: "online",
      statusMessage: "vient de se connecter",
    });
  });

  it("records sent messages and ignores blank ones", () => {
    let session = openConversation(createSession(cat), "conv-julie");
    session = sendMessage(session, "conv-julie", "  Salut !  ");
    session = sendMessage(session, "conv-julie", "   ");
    expect(session.sentMessages["conv-julie"]).toEqual([
      { id: "sent-1", text: "Salut !", atMs: 0 },
    ]);
  });

  it("reopening an already-open conversation keeps its runtime", () => {
    let session = openConversation(createSession(cat), "conv-julie");
    session = tick(session, cat, 1000);
    const before = session.runtimes["conv-julie"];
    session = closeConversation(session);
    session = openConversation(session, "conv-julie");
    expect(session.runtimes["conv-julie"]).toBe(before);
    expect(session.activeConversationId).toBe("conv-julie");
  });
});
