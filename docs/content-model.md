# Content model

All shared data contracts live in `packages/content-schema` as Zod schemas
(runtime-validated) with inferred TypeScript types. Nothing outside this
package should redefine these shapes.

| Type                                                          | File                    | Used by                                                                       |
| ------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| `EraManifest`                                                 | `src/era.ts`            | era-engine                                                                    |
| `HistoricalEvent`                                             | `src/event.ts`          | timeline-engine, `content/events/*.json`                                      |
| `SourceReference`                                             | `src/source.ts`         | any content citing provenance                                                 |
| `RightsStatus`                                                | `src/rights.ts`         | `HistoricalSnapshot`, admin rights review                                     |
| `HistoricalWebsite` / `HistoricalSnapshot`                    | `src/website.ts`        | browser-engine catalogue, `content/websites`, `content/snapshots`             |
| `ReconstructedPage` / `PageBlock`                             | `src/reconstruction.ts` | browser-engine, `content/reconstructions/*.json` (declarative pages, no HTML) |
| `SearchDocument` + `isAvailableAt`                            | `src/search.ts`         | Time Search Engine (Phase 6, not yet implemented)                             |
| `DesktopWindow`                                               | `src/desktop.ts`        | window-manager                                                                |
| `VirtualFile`                                                 | `src/filesystem.ts`     | desktop-engine virtual disk                                                   |
| `NarrativeTrigger` / `NarrativeCondition` / `NarrativeAction` | `src/narrative.ts`      | Narrative Engine (contracts only, not wired up)                               |

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

## Rights

`RightsStatus` is `"original" | "public-domain" | "licensed" |
"permission-granted" | "fair-use-review" | "reference-only" | "unknown"`
(`original` = era-inspired page authored by this project). See
`docs/rights-policy.md` — the admin (Phase 9, not yet built) must refuse to
publish anything left as `"unknown"`.
