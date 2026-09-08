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
pnpm dev                 # starts apps/web on http://localhost:3000
```

Other commands:

```bash
pnpm lint                # ESLint across the workspace
pnpm typecheck           # TypeScript, strict mode, across the workspace
pnpm test                # Vitest unit tests (every package)
pnpm build               # production build of apps/web
pnpm test:e2e            # Playwright end-to-end tests (starts the app itself)
```

## What works today (Phases 0–3)

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
```

1985 (Minitel), 1998 (early Web desktop), and 2005 (social web + video) each
load their own `EraManifest` (`eras/<id>/manifest.json`) — nothing is
hard-coded per era in the app code. Themes, boot sequences, disks and app
lists are all resolved from manifest keys.

Not yet implemented: Minitel UI, messenger / media player, admin app,
Supabase backend. See
`docs/roadmap.md`.

## Monorepo layout

```text
apps/
  web/                Next.js app — homepage, era loading/desktop routes
packages/
  content-schema/     Zod schemas + TS types shared by every engine
  era-engine/         Era manifest loading, validation, registry
  window-manager/     Pure window state (open/focus/move/resize/z-order)
  desktop-engine/     Boot sequences, themes, virtual disk, era clock
  apps-runtime/       App registry + per-era resolution
  browser-engine/     Time Web catalogue + resolveHistoricalUrl + history
  search-engine/      Dated search index derived from the catalogue
  timeline-engine/    Event date/category filtering, sorting, search
eras/                 EraManifest JSON, one folder per era
content/
  events/             HistoricalEvent seed data
  sources/            SourceReference seed data
tests/
  e2e/                Playwright specs
docs/                 Architecture & content model documentation
```

## Conventions

- Every cross-package data shape is a Zod schema in `packages/content-schema`
  — never redefine a shape locally.
- No era-specific logic in shared components; everything era-specific comes
  from `eras/<id>/manifest.json` via `@time-machine/era-engine`.
- No invented historical facts: unsourced or uncertain dates carry
  `needsResearch: true` instead of a guess (see `docs/historical-sources.md`).
- `RightsStatus: "unknown"` may never be published (see `docs/rights-policy.md`).
