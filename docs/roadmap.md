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
- [x] **Phase 5 — Time Web**: 14 documented sites, 12 original
      reconstructions (1998: AltaVista, Yahoo!, Google, GeoCities + a
      personal page, Hotmail, Excite, info.cern.ch; 2005: Google, Wikipédia,
      YouTube), temporal routing, 2005 virtual disk and favourites.
- [x] **Phase 6 — Time Search**: `packages/search-engine` — inverted index
      derived from the catalogue, +/-/"phrase" syntax, explainable ranking,
      hard temporal filter, per-era providers; results rendered inside the
      reconstructed search pages and navigable through the engine.
- [x] **Phase 7 — 1985 / Minitel**: `packages/minitel-engine` (40×25
      videotex layout, session state machine, nine function keys, data-driven
      kiosks/services/pages/datasets, latency as data, temporal filter),
      fictional services (3611 annuaire, 3614 BAL, 3615 DEMO/TEMPS/FUTUR),
      full-screen Minitel replacing the generic desktop via the theme's
      `shell: "terminal"`.
- [x] **Phase 8 — 2005**: `packages/messenger-engine` (scripted
      conversations, background presence, data-only — no chatbot) and
      `packages/media-engine` (video library gated by upload date, pure
      player, original placeholder animations — never real footage);
      Messenger and the media player are real windowed apps on the 2005
      desktop.
- [x] **Phase 9 — Admin**: `apps/admin` — CRUD for events, websites,
      snapshots, sources, Minitel services and video clips, reading and
      writing the same `content/*.json` files the live app reads (no
      database introduced; see `docs/admin.md`). The four-state review
      queue (`contentStatus()` in `packages/content-schema`) and the
      rights/research publish gate are enforced in code, in
      `apps/admin/lib/contentStore.ts`.
- [x] **Phase 10 — Polish** (`docs/polish.md`): `packages/audio-engine`
      (synthesised, original-only sound cues as data, bound per era in the
      manifest — modem handshake, carrier, notifications, window clicks) and
      `packages/analytics-engine` (opt-in, PII-refusing, local-only event
      queue with consent, surfaced at `apps/web`'s standalone `/analytics`
      page); keyboard-only desktop (window cycling, shortcuts, focusable
      title bars, real menus), ARIA roles and live regions across the apps,
      global reduced-motion coverage; short animations; per-app code
      splitting, memoised windows and idle-timer pausing.

- [x] **Phase 11 — Remaining engines**: `packages/computer-engine`
      (machine profiles as sourced data, link timing shown in the Time
      Browser, `VER`/`MEM`/`SYSINFO` in the terminal — `docs/computer-engine.md`),
      `packages/narrative-engine` (data-driven triggers in
      `content/narrative/`, pure dispatch, tray notifications and story files
      on the virtual disk — `docs/narrative-engine.md`) and
      `packages/museum-engine` (`/museum`, one sourced gallery per era —
      `docs/museum-engine.md`). Every engine of the architecture now exists.

## Recommended next step

Every engine in `docs/architecture.md` is implemented. Candidates, in order of leverage:

1. **Backend (Supabase)**: give `apps/admin` real multi-editor persistence
   (currently direct filesystem writes to `content/**/*.json` — see
   `docs/admin.md` for why that still holds at this scale) and give
   analytics a real collector behind the same consent gate.
2. **Content depth**: primary sources replacing the Wikipedia placeholders,
   screenshot/document snapshots (resolution step 2), more reconstructed
   pages per site.
3. **Narrative depth**: emit `event.viewed` / `time.changed` and perform
   `unlock.site`, `send.message`, `change.desktop`, `unlock.era` — the
   contracts exist; the catalogue refuses them until the runtime does.

## Known gaps carried forward

- Admin: writes go straight to `content/**/*.json` on disk — no
  authentication, no optimistic locking, no multi-editor support (see
  `docs/admin.md`'s "Known limitations"). That's future work once a real
  backend exists.
- Analytics: the only sink is the visitor's own browser; nothing is
  collected centrally yet (see `docs/polish.md`).
- Minitel: no graphic (mosaic) characters and no double-height text; the
  screen is text-only.
- Messenger: one scripted conversation per contact, no group chats, no
  file transfer (period-accurate but out of scope for the MVP).
- Media player: four clips, one library; no upload flow, no search.
- Reconstructions cover home + search pages (plus one personal page);
  other in-site links land on the home page or a `page-unknown` 404.
- No screenshot/document snapshots yet (step 2 of the resolution flow is
  exercised by unit tests only).
- The search index is rebuilt from the catalogue at load time; a database
  was deliberately not introduced for Phase 9 — see `docs/admin.md` for
  why the JSON-file approach still holds at this scale, and what would
  force a reconsideration.
- `apps/admin` has no authentication and writes directly to the repo's
  `content/*.json` files — it's a local/private tool, not something to
  expose on the public internet as-is (`docs/admin.md`).
- The virtual disk is read-only for the user (notepad edits are not
  persisted); only narrative `create.file` actions add files, for the
  current session.
- Machine profiles are representative configurations; the 2005 ADSL speed
  is flagged `needsResearch` until a primary source confirms it.
