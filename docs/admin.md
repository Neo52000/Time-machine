# Admin

Route `/admin` (`apps/web/app/admin/page.tsx`), backed by `packages/admin-engine`.

## Principle

There is no backend yet (see `docs/roadmap.md`): content is static JSON
compiled into the app. The admin is a **draft layer above that catalogue** —
create, edit, delete and "publish" operate on an in-browser state, seeded
from the real `content/**/*.json` at load time and persisted to
`localStorage` for convenience across reloads. It does not write back to the
repository; turning a draft into real content is still a manual step
(export the JSON, commit it) until a real backend exists.

This mirrors the discipline used everywhere else in the project: a pure,
framework-free "engine" (`packages/admin-engine`, fully unit-tested, no
timers/IO) plus a thin React component (`apps/web/components/admin/AdminApp.tsx`)
that owns the only side effects (`localStorage`, `window.confirm`/`alert`).

## Scope

Five collections, each backed by its `content-schema` Zod schema — nothing
new was added to `content-schema` for this phase:

| Collection        | Schema                     | Carries `rightsStatus` | Carries `needsResearch` |
| ----------------- | -------------------------- | ---------------------- | ----------------------- |
| `events`          | `HistoricalEventSchema`    | no                     | yes                     |
| `sources`         | `SourceReferenceSchema`    | no                     | no                      |
| `snapshots`       | `HistoricalSnapshotSchema` | yes                    | no                      |
| `minitelServices` | `MinitelServiceSchema`     | yes                    | yes                     |
| `videoClips`      | `VideoClipSchema`          | yes                    | yes                     |

Websites, Minitel kiosks/pages/datasets, messenger contacts/conversations
and media comments are out of scope for CRUD in this phase — they don't
carry `rightsStatus` (except through the collections above) and adding
every content shape to the admin at once would outgrow what's actually
needed to unblock the rights review workflow.

## Store (`packages/admin-engine/src/store.ts`)

```ts
type ItemStatus = "published" | "draft" | "modified";
interface AdminItem<T> {
  data: T;
  status: ItemStatus;
}
interface AdminState {
  events: Record<string, AdminItem<HistoricalEvent>>;
  sources: Record<string, AdminItem<SourceReference>>;
  snapshots: Record<string, AdminItem<HistoricalSnapshot>>;
  minitelServices: Record<string, AdminItem<MinitelService>>;
  videoClips: Record<string, AdminItem<VideoClip>>;
}
```

- `createAdminState(seed)` — validates every seeded record (fail fast, same
  as every other catalog) and marks it `"published"`.
- `createItem(state, kind, data)` — Zod-validates `data`, rejects a
  duplicate id, checks every `sourceIds` entry resolves to a known source;
  adds it as `"draft"`.
- `updateItem(state, kind, id, patch)` — merges `patch` into the existing
  record, re-validates the result, re-checks `sourceIds`; a `"published"`
  item becomes `"modified"`, a `"draft"` stays `"draft"`. Changing an item's
  id is rejected (create a new item instead).
- `deleteItem(state, kind, id)` — removes the record; deleting a source
  still referenced by another item (in any collection) is refused, listing
  what references it.
- `publishItem(state, kind, id)` — the rights gate: refuses when the record
  carries `rightsStatus: "unknown"` or when a `sourceIds` entry no longer
  resolves; otherwise marks the item `"published"`.

Every mutation returns `{ ok: true, state }` or `{ ok: false, errors:
string[] }` — never throws — so the UI can show validation errors inline
instead of crashing.

## Rights review queue (`packages/admin-engine/src/rights-queue.ts`)

`buildRightsQueue(state)` scans every collection and flags:

- **blocking** — `rightsStatus: "unknown"` (the hard rule from
  `docs/rights-policy.md`: this can never be published);
- **review** — `rightsStatus: "fair-use-review"`;
- **research** — `needsResearch: true` on any collection, when not already
  blocking.

Entries are sorted blocking → review → research. This is what makes the
`needsResearch` flags scattered across phases 1–8 (e.g. the Minitel
`annuaire` service's opening hours, "Me at the zoo"'s exact view count)
actionable instead of just documentation.

## UI (`apps/web/components/admin/AdminApp.tsx`)

- A tab per collection plus the rights review queue.
- Each row shows its status/rights/needsResearch badges and
  Modifier/Publier/Supprimer actions; "Corriger" on a queue entry jumps to
  that record's edit form.
- Create and edit both go through a JSON textarea validated by the same
  engine functions the tests use — there is no per-field form generator
  (out of scope; the schemas already are the source of truth for shape).

## Adding a new collection to the admin

1. It must already be a `content-schema` schema.
2. Add it to `AdminCollectionKind`/`SCHEMAS`/`ALL_KINDS` in
   `packages/admin-engine/src/store.ts`, and to `ASSET_KINDS` if it carries
   `rightsStatus`.
3. Seed it in `packages/admin-engine/src/content.ts` from its
   `content/**/*.json` file.
4. Add it to `KINDS`/`KIND_LABELS`/`NEW_TEMPLATES`/`describeItem` in
   `AdminApp.tsx`.
5. Add a unit test in `packages/admin-engine/src/admin.test.ts` covering at
   least create/update/delete/publish and, if it carries `rightsStatus` or
   `needsResearch`, the rights queue.
