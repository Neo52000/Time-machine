import { describe, expect, it } from "vitest";
import { adminSeed, initialAdminState } from "./content";
import { createAdminState, createItem, updateItem, deleteItem, publishItem } from "./store";
import { buildRightsQueue } from "./rights-queue";

const seedState = () => createAdminState(adminSeed);

describe("createAdminState", () => {
  it("loads every seeded record as published", () => {
    const state = initialAdminState;
    expect(Object.values(state.events).every((i) => i.status === "published")).toBe(true);
    expect(state.snapshots["snap-info-cern-ch-1991"]?.status).toBe("published");
    expect(state.minitelServices["annuaire"]?.data.mnemonic).toBe("ANNUAIRE");
  });

  it("rejects a duplicate id in the seed", () => {
    const dup = { ...adminSeed, sources: [...adminSeed.sources, adminSeed.sources[0]] };
    expect(() => createAdminState(dup)).toThrow(/Duplicate sources id/);
  });
});

describe("createItem", () => {
  it("adds a new source as a draft", () => {
    const result = createItem(seedState(), "sources", { id: "src-new", label: "Nouvelle source" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.sources["src-new"]).toMatchObject({ status: "draft" });
    }
  });

  it("rejects a record that fails schema validation", () => {
    const result = createItem(seedState(), "sources", { label: "Sans id" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toMatch(/id/);
  });

  it("rejects a duplicate id", () => {
    const result = createItem(seedState(), "sources", adminSeed.sources[0] as object);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/already exists/);
  });

  it("rejects an event referencing an unknown source", () => {
    const result = createItem(seedState(), "events", {
      id: "evt-new",
      date: "2000-01-01",
      title: "Nouvel evenement",
      summary: "...",
      category: ["web"],
      importance: 3,
      sourceIds: ["src-does-not-exist"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/unknown source/);
  });
});

describe("updateItem", () => {
  it("patches a field and marks a published item modified", () => {
    const result = updateItem(seedState(), "minitelServices", "annuaire", {
      description: "Description mise a jour",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.minitelServices["annuaire"]).toMatchObject({
        status: "modified",
        data: { description: "Description mise a jour" },
      });
    }
  });

  it("keeps a draft item as draft after a further edit", () => {
    const created = createItem(seedState(), "sources", { id: "src-new", label: "A" });
    if (!created.ok) throw new Error("setup failed");
    const result = updateItem(created.state, "sources", "src-new", { label: "B" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.sources["src-new"]?.status).toBe("draft");
  });

  it("rejects patching an unknown id", () => {
    const result = updateItem(seedState(), "sources", "ghost", { label: "x" });
    expect(result.ok).toBe(false);
  });

  it("rejects changing an item's id", () => {
    const result = updateItem(seedState(), "sources", adminSeed.sources[0]!.id, { id: "renamed" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/id.*not allowed/);
  });

  it("rejects an invalid patch", () => {
    const result = updateItem(seedState(), "minitelServices", "annuaire", {
      rightsStatus: "not-a-status",
    });
    expect(result.ok).toBe(false);
  });
});

describe("deleteItem", () => {
  it("removes an item with no dependents", () => {
    const created = createItem(seedState(), "sources", { id: "src-new", label: "A" });
    if (!created.ok) throw new Error("setup failed");
    const result = deleteItem(created.state, "sources", "src-new");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.sources["src-new"]).toBeUndefined();
  });

  it("refuses to delete a source still referenced elsewhere", () => {
    const referenced = adminSeed.snapshots[0] as { sourceIds: string[] };
    const result = deleteItem(seedState(), "sources", referenced.sourceIds[0]!);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/still referenced by/);
  });
});

describe("publishItem", () => {
  it("publishes a valid draft", () => {
    const created = createItem(seedState(), "videoClips", {
      id: "clip-new",
      title: "Nouveau clip",
      uploader: "test",
      uploadDate: "2005-06-01",
      durationSeconds: 10,
      description: "...",
      category: ["test"],
      viewsAtLaunch: 0,
      visual: "zoo",
      sourceIds: [adminSeed.sources[0]!.id],
      rightsStatus: "original",
    });
    if (!created.ok) throw new Error(`setup failed: ${created.errors.join(", ")}`);
    const result = publishItem(created.state, "videoClips", "clip-new");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.videoClips["clip-new"]?.status).toBe("published");
  });

  it("refuses to publish an asset left at unknown rights", () => {
    const created = createItem(seedState(), "videoClips", {
      id: "clip-bad",
      title: "Clip douteux",
      uploader: "test",
      uploadDate: "2005-06-01",
      durationSeconds: 10,
      description: "...",
      category: ["test"],
      viewsAtLaunch: 0,
      visual: "zoo",
      sourceIds: [adminSeed.sources[0]!.id],
      rightsStatus: "unknown",
    });
    if (!created.ok) throw new Error(`setup failed: ${created.errors.join(", ")}`);
    const result = publishItem(created.state, "videoClips", "clip-bad");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/rightsStatus is "unknown"/);
  });

  it("refuses to publish an event whose source was since removed", () => {
    const created = createItem(seedState(), "events", {
      id: "evt-orphan",
      date: "2000-01-01",
      title: "Evenement",
      summary: "...",
      category: ["web"],
      importance: 2,
      sourceIds: [adminSeed.sources[0]!.id],
    });
    if (!created.ok) throw new Error("setup failed");
    // Force an inconsistent state (bypassing normal deleteItem guards) to prove publish re-checks integrity.
    const { [adminSeed.sources[0]!.id]: _removed, ...rest } = created.state.sources;
    const inconsistent = { ...created.state, sources: rest };
    const result = publishItem(inconsistent, "events", "evt-orphan");
    expect(result.ok).toBe(false);
  });
});

describe("buildRightsQueue", () => {
  it("flags the seeded needsResearch items and orders by severity", () => {
    const queue = buildRightsQueue(initialAdminState);
    const ids = queue.map((e) => e.id);
    expect(ids).toContain("annuaire");
    expect(ids).toContain("meatthezoo");
    expect(queue.find((e) => e.id === "annuaire")?.severity).toBe("research");
  });

  it("marks unknown rights as blocking, ahead of review and research entries", () => {
    const created = createItem(seedState(), "videoClips", {
      id: "clip-unknown",
      title: "Clip",
      uploader: "test",
      uploadDate: "2005-06-01",
      durationSeconds: 10,
      description: "...",
      category: ["test"],
      viewsAtLaunch: 0,
      visual: "zoo",
      sourceIds: [adminSeed.sources[0]!.id],
      rightsStatus: "unknown",
    });
    if (!created.ok) throw new Error("setup failed");
    const queue = buildRightsQueue(created.state);
    expect(queue[0]).toMatchObject({ id: "clip-unknown", severity: "blocking" });
  });

  it("marks fair-use-review assets for review", () => {
    const updated = updateItem(seedState(), "snapshots", adminSeed.snapshots[0]!.id, {
      rightsStatus: "fair-use-review",
    });
    if (!updated.ok) throw new Error("setup failed");
    const queue = buildRightsQueue(updated.state);
    const entry = queue.find((e) => e.id === adminSeed.snapshots[0]!.id);
    expect(entry?.severity).toBe("review");
  });
});
