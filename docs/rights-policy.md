# Rights policy

`RightsStatus` (`packages/content-schema/src/rights.ts`):

```ts
type RightsStatus =
  | "original" // era-inspired reconstruction authored by this project
  | "public-domain"
  | "licensed"
  | "permission-granted"
  | "fair-use-review"
  | "reference-only"
  | "unknown";
```

## Rule

**Nothing with `rightsStatus: "unknown"` may be published**, and — same
gate — a record flagged `needsResearch: true` may not be published either.
This is enforced in code, not just documentation: `apps/admin/lib/collections.ts`
attaches a publish guard (built on `blockingReason` from
`packages/content-schema/src/status.ts`) to every collection that carries a
`published` field — events, websites, snapshots, Minitel services and video
clips — and `upsertRecord` (`apps/admin/lib/contentStore.ts`) rejects the
write with a `RightsViolationError` before anything touches disk. See
`docs/admin.md`.

Seed events written before the `published` field existed and already carry
`needsResearch: true` while defaulting to `published: true` (grandfathered
in — see `docs/admin.md`'s "why per-record, not whole-file" note). The
guard only blocks a _new_ attempt to set `published: true` on a blocked
record; it does not retroactively unpublish content the admin didn't touch.

## Guidance

- Prefer building **original, era-inspired reconstructions** over
  reproducing proprietary interfaces pixel-for-pixel (see master prompt §2.2).
  Trademarked UIs (Windows boot screens/sounds, Apple animations, specific
  browser chrome) must not be copied.
- Internet Archive / Wayback Machine content is a **documentary and
  reference source**, not the live rendering engine for the product (see
  `docs/browser-engine.md`). Anything sourced from it needs its own rights
  qualification before use beyond documentation.
- When in doubt about a specific asset's rights, default to
  `"fair-use-review"` or `"reference-only"`, never `"unknown"` left
  unresolved indefinitely, and never a guessed `"public-domain"`.
- **Sounds are never sampled.** Every cue in `content/audio/cues.json` is a
  synthesis description with `rightsStatus: "original"`;
  `packages/audio-engine` refuses any other status, so a recorded boot chime
  or modem cannot enter the catalogue (see `docs/polish.md`).
