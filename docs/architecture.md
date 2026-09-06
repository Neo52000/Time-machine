# Architecture

Time Machine is a pnpm/Turborepo monorepo. The engine is deliberately
separated from content: no era, event, or site is hard-coded into a
component — everything is loaded from data (`eras/`, `content/`) validated
against Zod schemas (`packages/content-schema`).

## Engines (per the master build prompt)

```text
TIME MACHINE
│
├── Timeline Engine     — packages/timeline-engine  (implemented: filtering/search)
├── Era Engine          — packages/era-engine        (implemented: manifest loader/registry)
├── Computer Engine     — not yet implemented
├── Desktop Engine      — not yet implemented (Phase 3)
├── Window Manager      — not yet implemented (Phase 3)
├── Application Runtime — not yet implemented (Phase 3)
├── Browser Engine      — not yet implemented (Phase 4)
├── Time Web Engine     — not yet implemented (Phase 5)
├── Time Search Engine  — not yet implemented (Phase 6)
├── Minitel Engine      — not yet implemented (Phase 7)
├── Museum Engine       — not yet implemented
├── Content Engine      — content/ + content-schema (partial: seed data only)
├── Source / Rights     — content-schema RightsStatus/SourceReference types (partial)
└── Narrative Engine    — type contracts only (packages/content-schema/src/narrative.ts)
```

## Current data flow (first vertical slice)

```text
apps/web homepage (Server Component)
  → era-engine.listEras()
  → HomeTimeline (Client Component, renders era markers)
  → click an era marker
  → /era/[eraId]/loading (reads era-engine.getEra(id))
  → LoadingScreen (Client Component, timed redirect)
  → /era/[eraId]/desktop (placeholder: boot sequence text + app list from the manifest)
```

## Monorepo layout

```text
apps/
  web/          Next.js app (App Router, TS, Tailwind)
packages/
  content-schema/   Zod schemas + inferred TS types shared by every engine
  era-engine/       Era manifest loading & validation
  timeline-engine/  Date-availability filtering, category filters, sorting, search
eras/               EraManifest JSON per era (1985, 1998, 2005)
content/
  events/           HistoricalEvent seed data
  sources/          SourceReference seed data
```

See `docs/era-format.md` and `docs/content-model.md` for the data contracts,
and `docs/roadmap.md` for what's next.
