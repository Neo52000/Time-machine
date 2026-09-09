# Minitel Engine (Phase 7 — implemented)

Package: `packages/minitel-engine`. UI: `apps/web/components/apps/MinitelApp.tsx`.
Content: `content/minitel/`.

## What the 1985 machine is

A Minitel has no desktop. The `minitel-videotex` theme declares
`shell: "terminal"`, so after the boot sequence the machine runs its first
app (`minitel`) full-screen, scaled up to fit the browser (320×240 native,
up to 3×). No windows, no taskbar; a small "← Timeline" link sits outside
the tube.

## Engine (pure TypeScript, no timers)

```text
createSession(selectedDate)             idle screen with the machine date
typeChar(state, char, catalog)          keyboard input, folded to A-Z/0-9 (accents stripped)
pressKey(state, key, catalog, options)  one of the nine function keys
resolvePending(state)                   completes a dial/load transition after `pending.ms`
renderScreen(state, catalog)            25 rows × 40 columns, each row with a videotex colour
```

Phases: `idle → dialing → kiosk → service` (plus a transient `loading`).
Latency is data (`SessionOptions.dialMs`, `loadMs`): the engine returns a
`pending` transition and the UI resolves it after the delay, so every
flow is unit-tested without timers.

Function keys, as on the terminal:

| Key             | Effect                                                     |
| --------------- | ---------------------------------------------------------- |
| `CONNEXION/FIN` | dial the typed number (idle) / hang up (connected)         |
| `ENVOI`         | validate the service code, a menu choice or an input field |
| `SOMMAIRE`      | service home page                                          |
| `RETOUR`        | previous screen of a long page, else previous page         |
| `SUITE`         | next screen of a long page                                 |
| `REPETITION`    | redraw                                                     |
| `GUIDE`         | the service's guide page (or a generic hint)               |
| `ANNULATION`    | clear the input                                            |
| `CORRECTION`    | delete the last character                                  |

Keyboard mapping in the UI: Enter, Escape, Backspace, Home, PageUp,
PageDown, F1, F2, End respectively; every key is also an on-screen button.

## Data model (`packages/content-schema/src/minitel.ts`)

- `MinitelKiosk` — an access code (`3611`, `3614`, `3615`) with a notice and
  an availability window; `directServiceId` connects straight to a service
  (the directory) instead of asking for a code.
- `MinitelService` — `kioskCode` + `mnemonic` (`3615 DEMO`), home and guide
  pages, availability window, `fictional` flag, rights status, sources.
- `MinitelPage` — blocks laid out on the 40×25 grid: `text` (colour,
  inverse, centred, word-wrapped), `blank`, `rule`, `menu` (key + label +
  action) and `input` (label, max length, action).
- Actions: `goto` a page of the same service, `lookup` a dataset field
  (prefix, accent-insensitive) and render the matches, `echo` the typed
  text on a confirmation page.
- `MinitelDataset` — rows of strings (the fictional directory).

`createMinitelCatalog` validates everything and checks referential
integrity: unknown pages, datasets, columns, kiosks or sources fail at load
time, as does a page linking outside its own service.

## Layout

Row 0 is the status line (kiosk, mnemonic, page title, `n/m` pager); rows
1–23 the body; row 24 the prompt/input or a transient message. Bodies
longer than 23 rows are split into screens reachable with `SUITE`/`RETOUR`.

## Time filter

Kiosks and services carry `availableFrom` / `availableUntil`. On the 1985
machine, `3615 FUTUR` (opens in 1990) answers "n'existe pas encore a cette
date" and a 1984 machine cannot dial `3615` at all.

## Content rules

- Every seed service is **fictional** and says so on screen; the only
  historical names are the access codes and the public directory service,
  both sourced (`src-wikipedia-minitel`, `src-wikipedia-teletel`) with
  `needsResearch: true` on dates that are not confirmed to the day.
- No tariff is quoted as a historical fact.
- Documentary reconstructions of real services can be added later without
  touching the engine: a service is data, its rights status must not be
  `unknown` unless it is flagged fictional.
