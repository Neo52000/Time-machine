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

Phase 4: Browser Engine (`packages/browser-engine`) — `resolveHistoricalUrl`,
temporal routing and history, plugged into the existing Time Browser shell
(`apps/web/components/apps/BrowserApp.tsx` already has the address bar,
back/forward history and status bar; only the content pane changes).

Known gaps carried forward:

- 1985 renders the generic desktop at 320×240 with a Minitel placeholder;
  Phase 7 replaces it with the videotex UI.
- 2005 uses the `silver-flatscreen-2005` theme tokens but `messenger` and
  `media-player` are placeholders until Phase 8.
- The virtual disk is read-only (notepad edits are not persisted).
