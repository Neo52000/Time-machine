import { z } from "zod";
import {
  HistoricalEventSchema,
  SourceReferenceSchema,
  HistoricalSnapshotSchema,
  MinitelServiceSchema,
  VideoClipSchema,
  type HistoricalEvent,
  type SourceReference,
  type HistoricalSnapshot,
  type MinitelService,
  type VideoClip,
} from "@time-machine/content-schema";

/**
 * Admin CRUD operates on a draft layer above the static, build-time content
 * JSON — there is no backend yet (see docs/roadmap.md). "Publishing" here
 * means marking a draft reviewed and rights-clean, not writing to disk.
 */
export type AdminCollectionKind =
  "events" | "sources" | "snapshots" | "minitelServices" | "videoClips";

export type AdminEntity =
  HistoricalEvent | SourceReference | HistoricalSnapshot | MinitelService | VideoClip;

/** Kinds whose records carry a `rightsStatus` and are subject to the publish gate. */
const ASSET_KINDS: ReadonlySet<AdminCollectionKind> = new Set([
  "snapshots",
  "minitelServices",
  "videoClips",
]);

const SCHEMAS: Record<AdminCollectionKind, z.ZodTypeAny> = {
  events: HistoricalEventSchema,
  sources: SourceReferenceSchema,
  snapshots: HistoricalSnapshotSchema,
  minitelServices: MinitelServiceSchema,
  videoClips: VideoClipSchema,
};

const ALL_KINDS: AdminCollectionKind[] = [
  "events",
  "sources",
  "snapshots",
  "minitelServices",
  "videoClips",
];

export type ItemStatus = "published" | "draft" | "modified";

export interface AdminItem<T = AdminEntity> {
  data: T;
  status: ItemStatus;
}

export type AdminCollection<T = AdminEntity> = Record<string, AdminItem<T>>;

export interface AdminState {
  events: AdminCollection<HistoricalEvent>;
  sources: AdminCollection<SourceReference>;
  snapshots: AdminCollection<HistoricalSnapshot>;
  minitelServices: AdminCollection<MinitelService>;
  videoClips: AdminCollection<VideoClip>;
}

export interface AdminSeed {
  events: unknown[];
  sources: unknown[];
  snapshots: unknown[];
  minitelServices: unknown[];
  videoClips: unknown[];
}

export type AdminResult = { ok: true; state: AdminState } | { ok: false; errors: string[] };

function zodIssuesToErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
}

/** Loads the seed content (fail-fast, same discipline as every other catalog). */
export function createAdminState(seed: AdminSeed): AdminState {
  const build = <T>(kind: AdminCollectionKind, records: unknown[]): AdminCollection<T> => {
    const schema = SCHEMAS[kind];
    const out: AdminCollection<T> = {};
    for (const raw of records) {
      const data = schema.parse(raw) as T;
      const id = (data as { id: string }).id;
      if (out[id]) throw new Error(`Duplicate ${kind} id "${id}" in seed content`);
      out[id] = { data, status: "published" };
    }
    return out;
  };

  return {
    events: build<HistoricalEvent>("events", seed.events),
    sources: build<SourceReference>("sources", seed.sources),
    snapshots: build<HistoricalSnapshot>("snapshots", seed.snapshots),
    minitelServices: build<MinitelService>("minitelServices", seed.minitelServices),
    videoClips: build<VideoClip>("videoClips", seed.videoClips),
  };
}

function sourceIdsOf(data: AdminEntity): string[] {
  return "sourceIds" in data && Array.isArray(data.sourceIds) ? data.sourceIds : [];
}

function checkSourceIds(state: AdminState, data: AdminEntity): string[] {
  const missing = sourceIdsOf(data).filter((id) => !state.sources[id]);
  return missing.map((id) => `sourceIds: unknown source "${id}"`);
}

/** Every place any collection's records could point at a source id. */
function findSourceReferences(state: AdminState, sourceId: string): string[] {
  const refs: string[] = [];
  for (const kind of ALL_KINDS) {
    if (kind === "sources") continue;
    for (const [id, item] of Object.entries(state[kind])) {
      if (sourceIdsOf(item.data).includes(sourceId)) refs.push(`${kind}/${id}`);
    }
  }
  return refs;
}

export function createItem(
  state: AdminState,
  kind: AdminCollectionKind,
  data: unknown,
): AdminResult {
  const parsed = SCHEMAS[kind].safeParse(data);
  if (!parsed.success) return { ok: false, errors: zodIssuesToErrors(parsed.error) };

  const entity = parsed.data as AdminEntity & { id: string };
  const collection = state[kind] as AdminCollection;
  if (collection[entity.id])
    return { ok: false, errors: [`A "${kind}" item with id "${entity.id}" already exists`] };

  const errors = kind === "sources" ? [] : checkSourceIds(state, entity);
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    state: {
      ...state,
      [kind]: { ...collection, [entity.id]: { data: entity, status: "draft" } },
    },
  };
}

export function updateItem(
  state: AdminState,
  kind: AdminCollectionKind,
  id: string,
  patch: Record<string, unknown>,
): AdminResult {
  const collection = state[kind] as AdminCollection;
  const existing = collection[id];
  if (!existing) return { ok: false, errors: [`No "${kind}" item with id "${id}"`] };

  const candidate = { ...existing.data, ...patch };
  const parsed = SCHEMAS[kind].safeParse(candidate);
  if (!parsed.success) return { ok: false, errors: zodIssuesToErrors(parsed.error) };

  const entity = parsed.data as AdminEntity & { id: string };
  if (entity.id !== id)
    return { ok: false, errors: ["Changing an item's id is not allowed; create a new item"] };

  const errors = kind === "sources" ? [] : checkSourceIds(state, entity);
  if (errors.length > 0) return { ok: false, errors };

  const nextStatus: ItemStatus = existing.status === "published" ? "modified" : existing.status;
  return {
    ok: true,
    state: {
      ...state,
      [kind]: { ...collection, [id]: { data: entity, status: nextStatus } },
    },
  };
}

export function deleteItem(state: AdminState, kind: AdminCollectionKind, id: string): AdminResult {
  const collection = state[kind] as AdminCollection;
  if (!collection[id]) return { ok: false, errors: [`No "${kind}" item with id "${id}"`] };

  if (kind === "sources") {
    const refs = findSourceReferences(state, id);
    if (refs.length > 0) {
      return { ok: false, errors: [`Source "${id}" is still referenced by: ${refs.join(", ")}`] };
    }
  }

  const { [id]: _removed, ...rest } = collection;
  return { ok: true, state: { ...state, [kind]: rest } };
}

export function publishItem(state: AdminState, kind: AdminCollectionKind, id: string): AdminResult {
  const collection = state[kind] as AdminCollection;
  const existing = collection[id];
  if (!existing) return { ok: false, errors: [`No "${kind}" item with id "${id}"`] };

  const errors = kind === "sources" ? [] : checkSourceIds(state, existing.data);
  if (
    ASSET_KINDS.has(kind) &&
    "rightsStatus" in existing.data &&
    existing.data.rightsStatus === "unknown"
  ) {
    errors.push(
      `Cannot publish ${kind}/${id}: rightsStatus is "unknown" (see docs/rights-policy.md)`,
    );
  }
  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    state: {
      ...state,
      [kind]: { ...collection, [id]: { data: existing.data, status: "published" } },
    },
  };
}

export { ASSET_KINDS, ALL_KINDS };
