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
- [x] **Phase 9 — Admin**: `packages/admin-engine` — draft CRUD
      (create/update/delete) over events, sources, snapshots, Minitel
      services and video clips, validated against the same
      `content-schema` types as every engine; a rights review queue
      (blocking `"unknown"`, review `"fair-use-review"`, research
      `needsResearch`) and a publish gate that refuses `"unknown"` rights
      (`docs/rights-policy.md`); `/admin` in `apps/web`.
- [x] **Phase 10 — Polish** (`docs/polish.md`): `packages/audio-engine`
      (synthesised, original-only sound cues as data, bound per era in the
      manifest — modem handshake, carrier, notifications, window clicks) and
      `packages/analytics-engine` (opt-in, PII-refusing, local-only event
      queue with consent); keyboard-only desktop (window cycling, shortcuts,
      focusable title bars, real menus), ARIA roles and live regions across
      the apps, global reduced-motion coverage; short animations; per-app
      code splitting, memoised windows and idle-timer pausing.

## Recommended next step

The MVP phases are complete. Candidates, in order of leverage:

1. **Backend (Supabase)**: persist the admin's drafts and publish to
   `content/**/*.json`; give analytics a real collector behind the same
   consent gate.
2. **Content depth**: primary sources replacing the Wikipedia placeholders,
   screenshot/document snapshots (resolution step 2), more reconstructed
   pages per site.
3. **Museum / Narrative engines**: still type contracts only.

Known gaps carried forward:

- Admin: the draft layer lives in `localStorage`, not a real backend —
  "publishing" is a status flag, not a write to `content/**/*.json`. That
  wiring is future work once a backend exists (see `docs/admin.md`).
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
- The search index is rebuilt from the catalogue at load time; a
  persisted index (Supabase, Phase 9+) is not needed at this scale.

- The virtual disk is read-only (notepad edits are not persisted).
