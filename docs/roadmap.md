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
- [x] **Phase 3 — Desktop 1998**: boot experience, real desktop, Window
      Manager, Application Runtime (`packages/window-manager`,
      `packages/desktop-engine`, `packages/apps-runtime`); draggable /
      resizable / minimizable / maximizable windows, taskbar + start menu,
      era clock, virtual disk, and the 1998 apps (browser shell, file
      manager, notepad, terminal, mail).
- [x] **Phase 4 — Browser**: `packages/browser-engine` — URL normalisation,
      six-step `resolveHistoricalUrl` (reconstruction → snapshot → allow-listed
      archive → document → card → temporal 404), rights gating, pure history;
      Time Browser renders declarative reconstructions (AltaVista, Yahoo!,
      Google beta, GeoCities, info.cern.ch) and temporal 404s with the
      explaining event.
- [ ] **Phase 5 — Time Web**: historical sites, snapshots, temporal
      routing.
- [ ] **Phase 6 — Time Search**: search index, date-filtered search UI.
- [ ] **Phase 7 — 1985 / Minitel**: engine, services, UI.
- [ ] **Phase 8 — 2005**: theme, messenger, video experience, browser.
- [ ] **Phase 9 — Admin**: events/sources/assets CRUD, rights review queue.
- [ ] **Phase 10 — Polish**: animations, audio, analytics, accessibility,
      performance.

## Recommended next step

Phase 5/6 together: Time Web content + Time Search. The browser already
resolves any site in the catalogue, so Phase 5 is mostly content (more
`HistoricalWebsite` / `ReconstructedPage` records, screenshot/document
snapshots with qualified rights). Phase 6 plugs a date-filtered index
(`SearchDocument` + `isAvailableAt`) into the `search-results` block that
AltaVista's and Google's reconstructions already render.

Known gaps carried forward:

- Reconstructions cover home + search pages only; other in-site links land
  on the home page or a `page-unknown` 404.
- No screenshot/document snapshots yet (step 2 of the flow is exercised by
  tests only).

- 1985 renders the generic desktop at 320×240 with a Minitel placeholder;
  Phase 7 replaces it with the videotex UI.
- 2005 uses the `silver-flatscreen-2005` theme tokens but `messenger` and
  `media-player` are placeholders until Phase 8.
- The virtual disk is read-only (notepad edits are not persisted).
