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
├── Desktop Engine      — packages/desktop-engine  (implemented: boot sequences, themes, virtual disk, era clock, mailbox)
├── Window Manager      — packages/window-manager  (implemented: pure state transitions, z-order, cascade, clamping)
├── Application Runtime — packages/apps-runtime    (implemented: app registry + per-era resolution)
├── Browser Engine      — packages/browser-engine  (implemented: URL normalisation, Time Web catalogue, 6-step resolution, history)
├── Time Web Engine     — browser-engine catalogue + content/websites|snapshots|reconstructions (seed only)
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
  → /era/[eraId]/desktop
      → Desktop (Client Component)
          → BootScreen        replays desktop-engine.getBootSequence(machine.bootSequence)
          → desktop root      sized to machine.resolution, scaled down to fit, themed with
                              desktop-engine.getDesktopTheme(machine.theme) CSS tokens
          → DesktopIcons      apps-runtime.resolveEraApps(registry, era)
          → Window × n        geometry from window-manager (Zustand store in lib/desktopStore.ts)
          → Taskbar           running windows, start menu, era clock (desktop-engine.createEraClock)
```

## Desktop layering (Phase 3)

```text
window-manager (pure TS)   openWindow / focus / minimize / maximize / move / resize / setViewport
        ▲                  → returns a new WindowManagerState; unit-tested without React
        │
lib/desktopStore.ts        Zustand store: wraps the transitions, holds per-window payloads
        ▲
components/desktop/*       Desktop, Window (pointer-drag/resize), Taskbar, DesktopIcons, BootScreen
        ▲
components/apps/*          appId → React component (index.ts); every app receives AppProps
                           { app, era, fs, payload, openApp, closeSelf } and never imports era data
```

Apps talk to each other only through `openApp(appId, payload)` (e.g. the file
manager opens a text file in notepad with `{ path }`), and read the disk only
through `desktop-engine` helpers (`listDirectory`, `readTextFile`), so the
same virtual disk is consistent across the file manager, notepad and terminal.

## Monorepo layout

```text
apps/
  web/          Next.js app (App Router, TS, Tailwind)
packages/
  content-schema/   Zod schemas + inferred TS types shared by every engine
  era-engine/       Era manifest loading & validation
  timeline-engine/  Date-availability filtering, category filters, sorting, search
  browser-engine/   URL normalisation, Time Web catalogue, resolveHistoricalUrl, browser history
  window-manager/   Window state transitions (no React)
  desktop-engine/   Boot sequences, themes, virtual filesystem, era clock, mailbox seeds
  apps-runtime/     App definitions (window defaults, singleton, era restrictions) + registry
eras/               EraManifest JSON per era (1985, 1998, 2005)
content/
  events/           HistoricalEvent seed data
  sources/          SourceReference seed data
  websites/         HistoricalWebsite seed data (Time Web)
  snapshots/        HistoricalSnapshot seed data (reconstruction / archive references)
  reconstructions/  ReconstructedPage JSON — declarative pages, no HTML
```

See `docs/era-format.md` and `docs/content-model.md` for the data contracts,
and `docs/roadmap.md` for what's next.
