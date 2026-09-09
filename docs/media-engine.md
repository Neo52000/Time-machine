# Media Engine (Phase 8 — implemented)

Package: `packages/media-engine`. UI: `apps/web/components/apps/MediaPlayerApp.tsx`.
Content: `content/media/`.

## Principle — reconstruction, never reproduction

No real video file is ever embedded. Each `VideoClip` carries a `visual`
key (`zoo`, `skate`, `webcam`, `bicycle`); the player renders it as an
**original CSS animation** (a gradient sway, a rolling pattern) with the
title overlaid, never a copy of real footage. This matters most for the
documentary entry: "Me at the zoo" (`relatedEventId: "first-youtube-video"`)
is a reconstruction inspired by the real 2005 event, sourced to Wikipedia,
with `rightsStatus: "original"` — the actual recording is never reproduced
(see `docs/rights-policy.md`).

## Temporal lock, shown rather than hidden

`isUnlocked(clip, selectedDate)` is `clip.uploadDate <= selectedDate`,
exactly like the Time Web's availability window. Unlike the browser (which
hides what doesn't exist yet behind a temporal 404), the media library
**shows every clip and locks the ones not uploaded yet** — a 🔒 and
"Disponible le JJ/MM/AAAA" — because discovering that the library's
centerpiece exists but isn't out yet is itself part of the experience.
`estimateViews` grows a clip's view count with time since upload (doubling
every ten days, capped ×50) — deterministic and unit-tested, not random.

## Player (pure state machine)

```text
createPlayerState(clip)   paused at 0
play / pause / seek(ms)   seek clamps to [0, duration] and un-ends a finished clip
tick(state, deltaMs)      advances position while playing, stops at "ended"
formatTime(ms)            "0:19", "1:15"
```

The UI drives `tick` from `requestAnimationFrame`, computing real elapsed
ms itself — the engine has no timers and is fully unit-tested with
synthetic deltas.

## Data model (`packages/content-schema/src/media.ts`)

- `VideoClip` — title, uploader, `uploadDate`, `durationSeconds`,
  description, category, `viewsAtLaunch`, `visual`, optional
  `relatedEventId`, sources, `rightsStatus` (never `unknown`, enforced by
  the catalogue), optional `needsResearch`.
- `VideoComment` — author, display date, text, tied to a `videoId`.

`createMediaCatalog` validates every record, checks that comments reference
real clips, and refuses a non-fictional clip published with unknown rights.

## Content

`content/media/videos.json`: "Me at the zoo" (locked until 23/04/2005) plus
three fictional clips uploaded on/before the 2005 machine's boot date
(01/01/2005) so the library never opens empty. `comments.json` holds a
handful of period-flavoured fictional comments per clip.
