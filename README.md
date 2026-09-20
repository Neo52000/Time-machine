# Time Machine — Internet History Simulator

Choisissez une date, chargez une époque, démarrez une machine, et
utilisez les réseaux et services numériques disponibles à cette date.

Time Machine est une plateforme immersive et data-driven pour voyager dans
l'histoire de l'informatique et d'Internet, directement dans le navigateur.
Voir `CLAUDE_CODE_TIME_MACHINE_MASTER_PROMPT.md` (fourni séparément) pour la
spécification produit complète, et `docs/roadmap.md` pour l'état d'avancement.

## Stack

Monorepo pnpm + Turborepo · Next.js (App Router) + React + TypeScript ·
Tailwind CSS · Zustand · Zod · Vitest · Playwright · ESLint · Prettier ·
GitHub Actions.

## Quickstart (< 10 min)

```bash
corepack enable          # ensures the pinned pnpm version is used
pnpm install
pnpm dev                 # starts every app in parallel: apps/web on :3000, apps/admin on :3001
```

Other commands:

```bash
pnpm lint                # ESLint across the workspace
pnpm typecheck           # TypeScript, strict mode, across the workspace
pnpm test                # Vitest unit tests (every package)
pnpm build               # production build of every app
pnpm test:e2e            # Playwright end-to-end tests (starts the app itself)
```

## What works today (Phases 0–9)

```text
Homepage ("WHEN DO YOU WANT TO GO?")
  → horizontal timeline with 1985 / 1998 / 2005 era markers
  → select an era
  → loading screen
  → boot sequence (BIOS-style, data-driven, click to skip)
  → desktop at the machine's native resolution, themed per era
      · icons, draggable / resizable / minimizable / maximizable windows
      · taskbar with start menu and the *simulated* era clock
      · 1998 apps: Time Browser, file manager over a virtual C: disk,
        notepad, DOS-like terminal (dir, cd, type, date…), mail inbox
  → Time Browser: type an address, get what existed at the machine's date
      · original reconstructions (AltaVista, Yahoo!, Google beta, GeoCities,
        info.cern.ch), in-page links and search forms
      · temporal 404 for sites not yet / no longer online, with the event
        that explains it — nothing is ever fetched from the real Internet
  → Time Search inside the reconstructed search engines
      · +mot / -mot / "expression" syntax, results filtered at the machine's
        date: Napster is unfindable in 1998, YouTube is findable in 2005
  → 1985 boots into a Minitel, not a desktop
      · dial 3611 / 3614 / 3615, type a service code, navigate with the
        nine function keys (on screen or on your keyboard), hang up
      · fictional services (3615 DEMO, TEMPS, 3614 BAL, an electronic
        directory) with simulated 1200/75 baud latency
  → 2005: Messenger (scripted conversation, background presence) and a
      media player (video library locked by upload date, original
      placeholder animations — never real footage — around a reconstruction
      of the first YouTube video)
```

1985 (Minitel), 1998 (early Web desktop), and 2005 (social web + video) each
load their own `EraManifest` (`eras/<id>/manifest.json`) — nothing is
hard-coded per era in the app code. Themes, shells, boot sequences, disks and app
lists are all resolved from manifest keys.

`apps/admin` (Phase 9, `http://localhost:3001`) is a local content-editing
tool: CRUD for events/websites/snapshots/sources, a four-state review queue,
and the actual enforcement of "nothing with unknown rights or unresolved
research gets published" — see `docs/admin.md`.

Not yet implemented: analytics, accessibility/performance polish (Phase 10).
See `docs/roadmap.md`.

## Monorepo layout

```text
apps/
  web/                Next.js app — homepage, era loading/desktop routes
  admin/              Next.js app — content CRUD + rights review (docs/admin.md)
packages/
  content-schema/     Zod schemas + TS types shared by every engine
  era-engine/         Era manifest loading, validation, registry
  window-manager/     Pure window state (open/focus/move/resize/z-order)
  desktop-engine/     Boot sequences, themes, virtual disk, era clock
  apps-runtime/       App registry + per-era resolution
  browser-engine/     Time Web catalogue + resolveHistoricalUrl + history
  search-engine/      Dated search index derived from the catalogue
  minitel-engine/     Videotex screen, session state machine, kiosks/services as data
  messenger-engine/   Scripted conversations, background presence (two-clock tick)
  media-engine/       Video library gated by upload date, pure playback state machine
  timeline-engine/    Event date/category filtering, sorting, search
eras/                 EraManifest JSON, one folder per era
content/
  events/             HistoricalEvent seed data
  sources/            SourceReference seed data
  websites/           HistoricalWebsite seed data (Time Web)
  snapshots/          HistoricalSnapshot seed data (reconstruction/archive refs)
  reconstructions/    ReconstructedPage JSON — declarative pages, no HTML
  minitel/            Kiosks, services, pages, datasets (fictional seed)
  messenger/          Contacts, scripted conversations, presence events (fictional seed)
  media/              Video clips and comments (fictional + one original reconstruction)
  assets/             Files imported through apps/admin
tests/
  e2e/                Playwright specs (tests/e2e/admin/ targets apps/admin)
docs/                 Architecture & content model documentation
```

## Conventions

- Every cross-package data shape is a Zod schema in `packages/content-schema`
  — never redefine a shape locally.
- No era-specific logic in shared components; everything era-specific comes
  from `eras/<id>/manifest.json` via `@time-machine/era-engine`.
- No invented historical facts: unsourced or uncertain dates carry
  `needsResearch: true` instead of a guess (see `docs/historical-sources.md`).
- `RightsStatus: "unknown"` may never be published, and neither may
  `needsResearch: true` content — enforced in `apps/admin`, not just
  documented (see `docs/rights-policy.md`, `docs/admin.md`).
