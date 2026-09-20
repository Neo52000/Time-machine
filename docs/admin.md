# Admin (Phase 9)

`apps/admin` is a small, local/private Next.js app for editors: CRUD over
events, websites, snapshots and sources, a four-state review queue, and the
first place that actually _enforces_ `docs/rights-policy.md` instead of
just documenting it.

## Why JSON files, not a database

Every engine built in Phases 1-8 already reads its content by statically
importing `content/**/*.json` and validating it with the Zod schemas in
`packages/content-schema` (see `docs/content-model.md`,
`docs/browser-engine.md`). `docs/roadmap.md` flagged, after Phase 6, that a
persisted search index "is not needed at this scale" — the same reasoning
applies to Phase 9: introducing Supabase now would mean standing up a
database _and_ rewriting `browser-engine`/`search-engine` to query it
instead of importing JSON, to manage a content set of a few dozen records.
`apps/admin` instead reads and writes the exact same files, through the
exact same schemas, so there is exactly one source of truth and no sync
step between "what the admin says" and "what the site shows."

This stops making sense once content volume, concurrent editors, or an
access-control requirement shows up — none of which exists yet. Revisit
then, not preemptively.

## Architecture

```text
apps/admin/
  lib/
    paths.ts          CONTENT_ROOT — the monorepo's content/ directory
                       (overridable via TIME_MACHINE_CONTENT_ROOT, used by
                       e2e tests so they never touch the real seed data)
    contentStore.ts    readCollection / writeCollection / getRecord /
                       upsertRecord / deleteRecord — generic over any
                       { id: string }[] JSON file + its Zod schema
    collections.ts     the four CollectionConfig values (events, websites,
                       snapshots, sources) and their publish guards
    apiHandlers.ts     collectionRoute() / recordRoute() factories —
                       GET/POST/GET/PUT/DELETE, shared by every API route
  app/
    api/<collection>/[route.ts, [id]/route.ts]   thin wrappers around the
                       handler factories
    api/assets/route.ts   controlled file upload into content/assets/
    <collection>/[page.tsx, new/page.tsx, [id]/page.tsx]   list, create,
                       edit — server components for reads, a client
                       <XForm> component per collection for writes
  components/
    fields.tsx         shared form primitives (Text/Date/TextArea/Number/
                       Select/Checkbox/Array), each auto-tagged
                       data-testid="field-<slugified-label>"
    StatusBadge.tsx / StatusCountsView.tsx   render packages/content-schema's
                       contentStatus() for one record / a whole collection
```

## The publish gate

`packages/content-schema/src/status.ts` defines the shared logic:

```ts
type ContentStatus = "needs-research" | "needs-rights-review" | "ready" | "published";

function blockingReason(record): string | null; // why it can't be published, or null
function contentStatus(record): ContentStatus; // the four-state badge
```

Each collection that has a `published` field attaches a guard built on
`blockingReason` (`apps/admin/lib/collections.ts`):

```ts
function eventPublishGuard(record: HistoricalEvent): string | null {
  if (!record.published) return null; // drafts are always fine
  return blockingReason(record) ? `Event "${record.id}" cannot be published: ...` : null;
}
```

`upsertRecord` runs the guard **only on the record being written**, then
throws `RightsViolationError` (surfaced to the editor as a 422 with the
reason, rendered as the form's error banner) before anything touches disk.

### Why per-record, not whole-file

An earlier version of this validated every record in the target JSON file
on every write. That broke immediately: several seed events predate the
`published` field, already have `needsResearch: true`, and default to
`published: true` (the schema default, so they stay live unchanged). A
whole-file check meant _any_ edit to _any_ event failed because of these
unrelated, already-shipped rows. The guard now only ever judges the record
actually being created or updated — it grandfathers in what's already
live and only stops a _new_ attempt to publish something blocked.

## Known limitations

- **No authentication.** This app is for local or otherwise privately
  hosted use only — do not expose it on the public internet as-is.
- **No optimistic locking.** Two editors saving the same file at the same
  moment can clobber each other, same as any other file-based tool.
- **Array fields are comma-separated text inputs** (`category`,
  `sourceIds`, `relatedEventIds`, `assetIds`) — the simplest UI that
  covers the current record sizes; revisit if lists get long or need
  autocomplete against existing ids.
- **Asset import is a raw file drop** into `content/assets/` (sanitized
  filename, timestamp-prefixed to avoid collisions) — no thumbnailing,
  no metadata extraction. Reference the returned `assetId` from a
  `SourceReference` or an event's `assetIds` by hand.
- **Preview** links out to the relevant `apps/web` page rather than
  rendering the content a second time inside the admin — one renderer,
  not two.

## Running it

```bash
pnpm --filter @time-machine/admin dev     # http://localhost:3001
```

`apps/web` and `apps/admin` are independent Next.js apps and can run at
the same time (ports 3000 and 3001).
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
