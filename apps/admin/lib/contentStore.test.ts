import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { HistoricalEvent, HistoricalSnapshot } from "@time-machine/content-schema";
import {
  deleteRecord,
  getRecord,
  readCollection,
  RightsViolationError,
  upsertRecord,
} from "./contentStore";
import { eventsCollection, snapshotsCollection } from "./collections";

const sampleEvent: HistoricalEvent = {
  id: "ev-1",
  date: "1998-09-04",
  title: "Sample event",
  summary: "A sample event for tests.",
  category: ["web"],
  importance: 3,
  sourceIds: [],
  published: true,
};

const sampleSnapshot: HistoricalSnapshot = {
  id: "snap-1",
  websiteId: "site-1",
  capturedAt: "1998-01-01",
  type: "screenshot",
  contentRef: "shot.png",
  sourceIds: [],
  rightsStatus: "original",
  published: true,
};

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "time-machine-admin-"));
  await mkdir(path.join(root, "events"), { recursive: true });
  await mkdir(path.join(root, "snapshots"), { recursive: true });
  await writeFile(
    path.join(root, "events", "events.json"),
    `${JSON.stringify([sampleEvent], null, 2)}\n`,
  );
  await writeFile(
    path.join(root, "snapshots", "snapshots.json"),
    `${JSON.stringify([sampleSnapshot], null, 2)}\n`,
  );
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("readCollection / writeCollection round-trip", () => {
  it("reads back exactly what was written", async () => {
    const events = await readCollection(eventsCollection, root);
    expect(events).toEqual([sampleEvent]);

    const updated: HistoricalEvent = { ...sampleEvent, title: "Updated title" };
    await upsertRecord(eventsCollection, updated, root);

    const after = await readCollection(eventsCollection, root);
    expect(after).toEqual([updated]);
  });

  it("upsert creates a new record and appends it", async () => {
    const created: HistoricalEvent = { ...sampleEvent, id: "ev-2", title: "New event" };
    await upsertRecord(eventsCollection, created, root);

    const all = await readCollection(eventsCollection, root);
    expect(all.map((e) => e.id).sort()).toEqual(["ev-1", "ev-2"]);
  });

  it("delete removes the record", async () => {
    await deleteRecord(eventsCollection, "ev-1", root);
    expect(await readCollection(eventsCollection, root)).toEqual([]);
  });

  it("getRecord finds by id or returns undefined", async () => {
    expect(await getRecord(eventsCollection, "ev-1", root)).toEqual(sampleEvent);
    expect(await getRecord(eventsCollection, "nope", root)).toBeUndefined();
  });
});

describe("rights policy enforcement — the whole point of this phase", () => {
  it("refuses to publish a snapshot with unknown rights", async () => {
    const bad: HistoricalSnapshot = {
      ...sampleSnapshot,
      rightsStatus: "unknown",
      published: true,
    };
    await expect(upsertRecord(snapshotsCollection, bad, root)).rejects.toThrow(
      RightsViolationError,
    );

    // The file on disk must be untouched — a rejected write is not a partial write.
    const unchanged = await readCollection(snapshotsCollection, root);
    expect(unchanged).toEqual([sampleSnapshot]);
  });

  it("allows saving an unknown-rights snapshot as a draft (published: false)", async () => {
    const draft: HistoricalSnapshot = {
      ...sampleSnapshot,
      id: "snap-2",
      rightsStatus: "unknown",
      published: false,
    };
    await upsertRecord(snapshotsCollection, draft, root);
    expect(await getRecord(snapshotsCollection, "snap-2", root)).toEqual(draft);
  });

  it("refuses to publish an event still flagged needsResearch", async () => {
    const bad: HistoricalEvent = {
      ...sampleEvent,
      id: "ev-3",
      needsResearch: true,
      published: true,
    };
    await expect(upsertRecord(eventsCollection, bad, root)).rejects.toThrow(RightsViolationError);
  });

  it("publishes once the blocker is cleared", async () => {
    const fixed: HistoricalEvent = { ...sampleEvent, needsResearch: false, published: true };
    await upsertRecord(eventsCollection, fixed, root);
    expect(await getRecord(eventsCollection, "ev-1", root)).toEqual(fixed);
  });

  it("does not re-validate untouched legacy rows elsewhere in the same file", async () => {
    // A record that predates `published` and is already live despite
    // needsResearch: true (schema default grandfathers it in). Editing a
    // *different* event in the same file must not be blocked by this one.
    const legacy: HistoricalEvent = {
      ...sampleEvent,
      id: "ev-legacy",
      needsResearch: true,
      published: true,
    };
    await writeFile(
      path.join(root, "events", "events.json"),
      `${JSON.stringify([sampleEvent, legacy], null, 2)}\n`,
    );

    const created: HistoricalEvent = { ...sampleEvent, id: "ev-new", title: "Unrelated new event" };
    await upsertRecord(eventsCollection, created, root);

    const all = await readCollection(eventsCollection, root);
    expect(all.map((e) => e.id).sort()).toEqual(["ev-1", "ev-legacy", "ev-new"]);
  });
});
