# Polish (Phase 10 — implemented)

Packages: `packages/audio-engine`, `packages/analytics-engine`, plus additions
to `window-manager` (`cycleWindow`) and `desktop-engine` (`shortcuts.ts`).
UI: `apps/web/lib/audio`, `apps/web/lib/analytics`, `apps/web/lib/useReducedMotion.ts`,
`components/desktop/*`, `components/ConsentBanner.tsx`, `components/AnalyticsPanel.tsx`
(standalone `/analytics` page).

Same discipline as every other phase: what can be pure is a tested engine
package; the UI owns the side effects (Web Audio, `localStorage`, timers,
focus) and nothing else.

## Audio

### Rule

Every sound is **synthesised from data** — never sampled. A cue is a list of
tone/noise segments (`SoundCueSchema`, `packages/content-schema/src/audio.ts`)
stored in `content/audio/cues.json`, all with `rightsStatus: "original"`;
`createAudioCatalog` refuses anything else. This is how the project stays
clear of trademarked boot chimes and recorded modem tones
(`docs/rights-policy.md`).

### Data

Eras bind moments to cues in their manifest (`machine.sounds`, see
`docs/era-format.md`): `boot`, `window-open`, `window-close`, `notification`,
`dial`, `connect`, `disconnect`, `error`. A missing binding means silence —
the 1998 machine has no `notification`, the Minitel has no windows.

| Cue                    | Used by             | What it is                                                                                                                                                             |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modem-handshake-v23`  | 1985 `dial`         | 440 Hz dial tone, DTMF 3615, ringback, 2100 Hz server answer, line hiss                                                                                                |
| `minitel-carrier`      | 1985 `connect`      | V.23 whistle: 1300 Hz forward carrier + 390 Hz return carrier, hiss                                                                                                    |
| `modem-hangup`         | 1998 `disconnect`   | relay click, then a short fading band-passed hiss                                                                                                                      |
| `modem-dialup-v32`     | 1992 `dial`         | 14 400 bit/s handshake, ~6 s: dial tone, fictional BBS number, ringback, 2100 Hz answer, two-tone training, hiss                                                       |
| `modem-dialup-v90`     | 1998 `dial`         | 56k RTC handshake, ~9 s: dial tone, fictional number, ringback, ANSam 2100 Hz with phase-reversal dips, V.8 FSK bursts, line-probing chords, training whistle and hiss |
| `minitel-hangup`       | 1985 `disconnect`   | 1300 → 300 Hz glide                                                                                                                                                    |
| `minitel-error`        | 1985 `error`        | two low square pulses                                                                                                                                                  |
| `minitel-power`        | 1985 `boot`         | degauss thump + noise burst                                                                                                                                            |
| `pc-post-beep`         | 1998 `boot`         | 1 kHz square, 140 ms                                                                                                                                                   |
| `pc-chime-2005`        | 2005 `boot`         | three-note triangle arpeggio                                                                                                                                           |
| `pc-window-open/close` | 1998 & 2005         | two 40 ms sine clicks, up / down                                                                                                                                       |
| `pc-error`             | 1998 & 2005 `error` | one low square note (temporal 404)                                                                                                                                     |
| `im-nudge`             | 2005 `notification` | three ascending sine notes (incoming message)                                                                                                                          |

The Minitel handshake lasts exactly 2200 ms — the Minitel engine's `dialMs` — so it
ends as the kiosk appears (`audio.test.ts` pins this).

A segment may carry `bandpassHz`: the adapter routes it through a band-pass
filter (Q 1.4), which turns white noise into the narrow hiss of a phone line
or a modem's training sequence. Still pure synthesis — no sample anywhere.

**Dial-up connection (1998).** The machine's link comes from its Computer
Engine profile. On a `dial-up` link, the Time Browser's first real address
plays the era's `dial` cue and the connection (`useNetworkConnection`, state
in the desktop store) reads _Numérotation…_ for the cue's duration, then
_Connecté — modem 56 kbit/s_; it then stays up until the user hangs up, so
the modem never redials on its own. The mail client's _Relever le courrier_
also dials when the line is down. A modem icon in the taskbar tray shows the
link (🔌 / 📞 / 🌐): clicking it dials by hand, or hangs up — `stopAll()`
cuts a handshake still playing, then the `disconnect` cue (`modem-hangup`,
relay click + fading hiss) plays. Pages never wait for the handshake. A
`broadband` link (2005) is online at once, silently, with no tray icon.

### Engine (`packages/audio-engine`)

- `createAudioCatalog(cues)` — Zod + duplicate ids + original-only +
  tone-needs-frequency + ≤ 15 s.
- `scheduleCue(cue, startAtMs, prefs)` → `ScheduledSegment[]` with absolute
  times and gain scaled by the volume preference; `[]` when muted.
- `resolveSoundCue(catalog, era.machine, event)` and
  `unresolvedSoundBindings` (every manifest binding is checked in tests).
- `AudioPreferences` (`enabled`, `volume`), `parseAudioPreferences` (tolerant
  of anything found in storage), `toggleAudio`, `setVolume`.

### UI (`apps/web/lib/audio/AudioProvider.tsx`)

The only file that touches Web Audio. `useAudio().play(event)` resolves the
cue for the current era, schedules it, and renders each segment with an
oscillator (or a looping noise buffer) under a click-free gain envelope.
The AudioContext is created lazily on first play (autoplay policy: the boot
click is the gesture). The mute preference persists under
`localStorage["time-machine-audio"]`; the toggle lives in the taskbar tray
(`audio-toggle`) and next to the Minitel's "← Timeline" link.

Every resolved cue also dispatches a `tm:audio` DOM event
(`{ event, cueId, segments }`) so tests can observe playback without hearing
it — `segments: 0` proves the mute works.

Where sounds fire: `Desktop` (boot, window open/close by watching the window
count so icons, menu, shortcuts and `closeSelf` all sound alike), `MinitelApp`
(phase transitions: dial → connect / disconnect, plus a refused input),
`MessengerApp` (a message that _arrives_), `BrowserApp` (temporal 404, and the
modem `dial` on a dial-up machine's first connection).

## Accessibility

- **Keyboard desktop** (`desktop-engine/shortcuts.ts`, pure matcher + data):
  Alt+Tab / Alt+Shift+Tab when the browser lets it through, otherwise
  Ctrl+Alt+→ / ← to cycle windows (`cycleWindow` in `window-manager`,
  restores minimized ones like a real Alt+Tab), Ctrl+Alt+M minimize,
  Ctrl+Alt+Enter maximize/restore, Ctrl+Alt+X close, Ctrl+Alt+S start menu.
  The start menu lists them.
- **Windows** are `role="dialog"` labelled by their title; focus moves into
  a window when it becomes active (unless the user is already typing in it)
  and back to the desktop when the last one closes. The title bar is
  focusable: arrows move the window, Shift+arrows resize it, Enter maximizes.
- **Start menu** is a real `menu`: focus enters the first item, arrows /
  Home / End move, Escape closes and returns focus to the Start button.
- **Icons** are arrow-navigable; the file manager's rows expose a button
  instead of a focusable `<tr>`.
- **Live regions**: the Messenger log is `role="log"` (`aria-live="polite"`,
  additions only) and contact statuses announce presence changes; the
  Minitel exposes a visually hidden status (`minitel-status`) describing the
  phase, kiosk/service and messages, since the videotex grid itself is noise
  to a screen reader; the media player's play button carries a label and
  `aria-pressed`.
- **Reduced motion**: a global rule in `globals.css` collapses every
  animation/transition; `useReducedMotion` additionally shortens the loading
  screen (400 ms) and shows the whole boot sequence at once (1.2 s hold).
  Simulated latencies (Minitel dial, message reveal) are content, not
  motion, and are unchanged.

## Animations

Deliberately few and short (≤ 160 ms): window open, start menu, Messenger
line arrival and typing dots, the Minitel tube "breathing" while dialing,
the media progress bar. Reconstructed web pages still animate nothing —
period accuracy wins.

## Analytics

### Rule

Opt-in, anonymous, local. Nothing is sent anywhere: there is no collector,
so the only sink is a ring buffer of 200 events in the visitor's own
browser (`localStorage["time-machine-analytics-events"]`). The consent
banner (`ConsentBanner`, homepage only) says exactly that; the answer is
stored under `time-machine-analytics-consent`.

### Engine (`packages/analytics-engine`)

- `AnalyticsEventSchema` (`content-schema/src/analytics.ts`): a closed list
  of names, scalar-only props, epoch `at`, random `sessionId`.
- `record(state, name, props, now)` — invalid names/props are dropped;
  anything that looks personal (`email`, `name`, `phone`, `ip`, `user*` keys
  or an email-shaped value) is dropped whole (`containsPersonalData`).
  Before consent the event waits in a 50-event buffer; `setConsent("granted")`
  releases it, `"denied"` discards it.
- `flush(state, max)` returns batches only when granted; `summarize`
  counts by name for the admin panel; `createSessionId(random)`.

Events: `era.selected`, `boot.completed { skipped }`, `app.opened`,
`browser.resolved { type }`, `search.performed { provider, results }`,
`minitel.connected { kiosk, service }`, `messenger.sent`, `media.played`,
`admin.published { kind }`, `audio.toggled`,
`passport.shared { stamps, method }`.

### UI

`AnalyticsProvider` (root layout) owns the state and drains it every 3 s and
on `pagehide`. `useAnalytics().track(name, props)` is called at the points
above. The standalone **`/analytics`** page (`AnalyticsPanel`, linked as
"Mesures" from the homepage) shows consent, counts per event, the last 30
events, and lets the owner revoke consent or clear the buffer. Swapping the
local sink for a real collector is a one-line change in `drain` once a
backend exists.

## Performance

- **Per-app chunks**: `components/apps/index.ts` loads every app with
  `next/dynamic`, so the 1985 Minitel page no longer ships the Time Web
  catalogue and search index that only the browser needs.
- **Memoised windows**: `Window` is `React.memo` and reads its actions from
  the store, so dragging or resizing one window re-renders that window
  only; the app element is created inside `Window` from stable props
  (`EMPTY_PAYLOAD`, cached fallback app definitions).
- **Idle timers**: the Messenger's 200 ms tick pauses while the tab is
  hidden.
- Measured with `next build` (first-load JS): see the Phase 10 pull request
  for the before/after table.

## Tests

- `packages/audio-engine/src/audio.test.ts` (14), `packages/analytics-engine/src/analytics.test.ts` (9),
  `packages/window-manager/src/cycle.test.ts` (4), `packages/desktop-engine/src/shortcuts.test.ts` (4).
- `tests/e2e/polish.spec.ts`: keyboard-only window management and start
  menu; reduced-motion loading/boot; the modem handshake and mute
  persistence observed through `tm:audio`; 1998 window sounds; consent
  accept/decline paths ending on the standalone `/analytics` page; live
  regions and the keyboard-operable file manager.
