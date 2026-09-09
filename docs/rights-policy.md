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

**Nothing with `rightsStatus: "unknown"` may be published.** This is
enforced by the admin app (`docs/admin.md`, Phase 9): `publishItem` in
`packages/admin-engine` refuses any snapshot, Minitel service or video clip
left at `"unknown"`, and the rights review queue lists it as blocking.

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
