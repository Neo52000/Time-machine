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

- [x] **Phase 12 — Vertical timeline**: the homepage timeline is a single
      vertical column (readable from a phone to a wide screen) grouped by
      year, with the playable eras as stations, decade jumps, category
      filters and per-event sources; 37 more sourced events (1981 → 2022).

- [x] **Phase 13 — Play**: the 1992 era (VGA PC, 14 400 bit/s modem,
      `packages/bbs-engine` + Terminal BBS with three fictional boards,
      downloads timed on the modem, the one-site Web of 1992 —
      `docs/bbs-engine.md`); Minitel mosaic (semi-graphic) pictures
      (`docs/minitel-engine.md`); a richer story: Messenger messages,
      reward wallpapers and a visitor passport of 18 stamps across the four
      eras (`docs/narrative-engine.md`). Boot screens no longer name real
      BIOS/CPU/disk brands and now match the machine profiles.

- [x] **Phase 14 — Ship**: `apps/web` is deployable and indexable
      (`netlify.toml` — web only, never `apps/admin`; `sitemap.xml` and
      `robots.txt` derived from the era registry and the museum; canonical
      URLs, Open Graph / Twitter metadata, original `next/og` share cards per
      era and gallery); the visitor passport becomes a shareable link
      (`/passport/<stamp ids>`, no server, nothing personal — opt-in
      `passport.shared` analytics); `event.viewed` is emitted by the Time
      Browser and drives a « Note d'histoire » pointing to the museum.
      `unlock.site` / `unlock.era` / `time.changed` stay refused on purpose
      (`docs/narrative-engine.md`).

## Recommended next step

Every engine in `docs/architecture.md` is implemented and the web app can
ship. Candidates, in order of leverage:

1. **Go live**: create the Netlify site from `netlify.toml`, set
   `NEXT_PUBLIC_SITE_URL`, submit the sitemap to Search Console — then let
   real traffic (opt-in `passport.shared`, `era.selected`) pick between 2–4.
2. **Content depth**: primary sources replacing the Wikipedia placeholders,
   screenshot/document snapshots (resolution step 2), more reconstructed
   pages per site — what the museum and share cards put in front of visitors.
3. **Backend (Supabase)**: multi-editor persistence for `apps/admin` and a
   real analytics collector behind the same consent gate — once there is
   traffic to collect and more than one editor.
4. **A fifth era** (smartphone / 2010s), reusing every engine as data.

## Known gaps carried forward

- Admin: writes go straight to `content/**/*.json` on disk — no
  authentication, no optimistic locking, no multi-editor support (see
  `docs/admin.md`'s "Known limitations"). That's future work once a real
  backend exists.
- Analytics: the only sink is the visitor's own browser; nothing is
  collected centrally yet (see `docs/polish.md`).
- Minitel: no double-height text (mosaic pictures exist since Phase 13).
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
