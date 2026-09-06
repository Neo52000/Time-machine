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
pnpm test                # Vitest unit tests (content-schema, era-engine, timeline-engine)
pnpm build               # production build of apps/web
pnpm test:e2e            # Playwright end-to-end tests (starts the app itself)
```

## What works today (first vertical slice)

```text
Homepage ("WHEN DO YOU WANT TO GO?")
  → horizontal timeline with 1985 / 1998 / 2005 era markers
  → select an era
  → loading screen
  → desktop placeholder (boot sequence text + the era's app list)
```

1985 (Minitel), 1998 (early Web desktop), and 2005 (social web + video) each
load their own `EraManifest` (`eras/<id>/manifest.json`) — nothing is
hard-coded per era in the app code.

Not yet implemented: real desktop/window manager, internal browser, time
search, Minitel UI, messenger, admin app, Supabase backend. See
`docs/roadmap.md`.

## Monorepo layout

```text
apps/
  web/                Next.js app — homepage, era loading/desktop routes
packages/
  content-schema/     Zod schemas + TS types shared by every engine
  era-engine/         Era manifest loading, validation, registry
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
