# Content model

All shared data contracts live in `packages/content-schema` as Zod schemas
(runtime-validated) with inferred TypeScript types. Nothing outside this
package should redefine these shapes.

| Type                                                                 | File                    | Used by                                                                       |
| -------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `EraManifest`                                                        | `src/era.ts`            | era-engine                                                                    |
| `HistoricalEvent`                                                    | `src/event.ts`          | timeline-engine, `content/events/*.json`                                      |
| `SourceReference`                                                    | `src/source.ts`         | any content citing provenance                                                 |
| `RightsStatus`                                                       | `src/rights.ts`         | `HistoricalSnapshot`, admin rights review                                     |
| `HistoricalWebsite` / `HistoricalSnapshot`                           | `src/website.ts`        | browser-engine catalogue, `content/websites`, `content/snapshots`             |
| `ReconstructedPage` / `PageBlock`                                    | `src/reconstruction.ts` | browser-engine, `content/reconstructions/*.json` (declarative pages, no HTML) |
| `SearchDocument` + `isAvailableAt`                                   | `src/search.ts`         | search-engine                                                                 |
| `ContentStatus` + `contentStatus` / `blockingReason`                 | `src/status.ts`         | apps/admin's four-state review queue and publish gate                         |
| `DesktopWindow`                                                      | `src/desktop.ts`        | window-manager                                                                |
| `VirtualFile`                                                        | `src/filesystem.ts`     | desktop-engine virtual disk                                                   |
| `MinitelKiosk` / `MinitelService` / `MinitelPage` / `MinitelDataset` | `src/minitel.ts`        | minitel-engine, `content/minitel/` (fictional seed)                           |
| `MessengerContact` / `MessengerConversation` / `PresenceEvent`       | `src/messenger.ts`      | messenger-engine, `content/messenger/` (fictional seed)                       |
| `VideoClip` / `VideoComment`                                         | `src/media.ts`          | media-engine, `content/media/` (original reconstruction + fictional clips)    |
| `NarrativeTrigger` / `NarrativeCondition` / `NarrativeAction`        | `src/narrative.ts`      | Narrative Engine (contracts only, not wired up)                               |
| `SoundCue` / `CueSegment` / `SoundEvent`                             | `src/audio.ts`          | audio-engine, `content/audio/cues.json`, `EraManifest.machine.sounds`         |
| `AnalyticsEvent` / `AnalyticsEventName`                              | `src/analytics.ts`      | analytics-engine (closed event list, scalar props only)                       |

`packages/admin-engine` (`docs/admin.md`) adds no new schema — it CRUDs
`HistoricalEvent`, `SourceReference`, `HistoricalSnapshot`, `MinitelService`
and `VideoClip` directly against these same Zod definitions, as a draft
layer above the static content until a real backend exists.

## Events

`content/events/events.json` holds the MVP seed events (§19 of the master
prompt): Minitel launch, first website/server/webcam, Yahoo!, Lycos,
AltaVista, Google, MSN Messenger, Napster, Wikipedia, Facebook, Gmail,
Skype, Myspace, YouTube + first video, Twitter.

Rules:

- **No invented dates.** Where the exact day isn't confidently sourced,
  `needsResearch: true` is set instead of guessing.
- Every event must carry at least one `sourceIds` entry pointing into
  `content/sources/sources.json`.

## Sources

`content/sources/sources.json` holds `SourceReference` entries. The MVP seed
uses general reference sources (Wikipedia, W3C) as placeholders — replacing
these with primary sources (contemporary press, archived pages, official
company histories) is tracked as follow-up work, not blocking the technical
MVP.

## Websites, snapshots, reconstructions

`content/websites/websites.json`, `content/snapshots/snapshots.json` and
`content/reconstructions/*.json` feed the Time Web catalogue
(`docs/browser-engine.md`). Same rules as events: sourced dates or
`needsResearch: true`, at least one `sourceIds` entry, and referential
integrity checked at load time.

## Draft vs. published

`HistoricalEvent`, `HistoricalWebsite` and `HistoricalSnapshot` all carry a
`published: boolean` field (default `true`, so every pre-existing seed
record stays live unchanged). `apps/admin` is the only writer that sets it
`false` (a draft in progress). `packages/browser-engine`'s catalogue
excludes unpublished events and snapshots — and any reconstruction page
that belongs to an unpublished snapshot — before its referential-integrity
checks run, so a draft never needs to satisfy them yet (see
`docs/browser-engine.md`). A website's own `published` flag is editorial
only (not filtered by the catalogue): its real visibility already comes
from `availableFrom`/`availableUntil` and whether it has any published
snapshot.

## Rights

`RightsStatus` is `"original" | "public-domain" | "licensed" |
"permission-granted" | "fair-use-review" | "reference-only" | "unknown"`
(`original` = era-inspired page authored by this project). See
`docs/rights-policy.md` and `docs/admin.md` — `apps/admin` refuses to save
anything as published while its rights status is `"unknown"` or it's still
flagged `needsResearch`.
`docs/rights-policy.md` — the admin (`docs/admin.md`, Phase 9) refuses to
publish anything left as `"unknown"`, and its rights review queue surfaces
every `"fair-use-review"` asset and every `needsResearch` record.
