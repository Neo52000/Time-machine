# Roadmap

Mirrors the phased plan from the master build prompt (§34). Work proceeds
in small, independently verifiable increments — analyse → plan →
implement → test → validate → commit.

- [x] **Phase 0 — Foundation**: monorepo (pnpm + Turborepo), Next.js,
      TypeScript, lint, tests, CI.
- [x] **Phase 1 — Timeline**: `HistoricalEvent` model, seed data, homepage
      timeline UI, era selection.
- [x] **Phase 2 — Era Engine**: `EraManifest` model, loader/registry,
      routing (`/era/[eraId]/loading`, `/era/[eraId]/desktop`).
- [ ] **Phase 3 — Desktop 1998**: boot experience, real desktop, Window
      Manager, Application Runtime (today's `/era/[eraId]/desktop` is a
      placeholder only — no windows, no app runtime yet).
- [ ] **Phase 4 — Browser**: internal browser, routing, history, URL
      resolver (`resolveHistoricalUrl`).
- [ ] **Phase 5 — Time Web**: historical sites, snapshots, temporal
      routing.
- [ ] **Phase 6 — Time Search**: search index, date-filtered search UI.
- [ ] **Phase 7 — 1985 / Minitel**: engine, services, UI.
- [ ] **Phase 8 — 2005**: theme, messenger, video experience, browser.
- [ ] **Phase 9 — Admin**: events/sources/assets CRUD, rights review queue.
- [ ] **Phase 10 — Polish**: animations, audio, analytics, accessibility,
      performance.

## Recommended next step

Phase 3: Desktop Engine + Window Manager (`packages/window-manager`,
`packages/desktop-engine`, `packages/apps-runtime`), replacing the current
`/era/[eraId]/desktop` placeholder with real draggable/resizable windows
and an app registry, starting with the 1998 era's `browser`,
`file-manager`, `notepad`, `terminal`, `mail` apps.
