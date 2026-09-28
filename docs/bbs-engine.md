# BBS Engine (1992)

Package: `packages/bbs-engine`. Data: `content/bbs/boards.json`. Schema:
`BbsBoardSchema` (`packages/content-schema/src/bbs.ts`). App:
`apps/web/components/apps/BbsApp.tsx` (« Terminal BBS », 1992 only).

## What a BBS was, here

A bulletin board system was a computer someone ran on their own phone line.
Callers dialled it with a modem, picked a handle, and read forums and
bulletins or downloaded files. The three boards shipped (Le Grenier
Numérique, Pixel Club, La Passerelle) are **fictional** (`fictional: true`,
source `src-timemachine-bbs-fiction`, `rightsStatus: "original"`): no real
board, handle or file is reproduced, file contents are never shown, and the
phone numbers use the 8-digit format of 1992 with an obviously fictional
`00 00` block.

## Model

`BbsBoard` → `areas` (`messages` | `files` | `bulletins`, reached by a menu
letter; `G` is reserved for goodbye) → `items` (title, author, date, body;
files add a DOS 8.3 `filename` and `sizeKb`). `createBbsCatalog` refuses
duplicate ids, a menu letter used twice, a file without name or size, an
unknown source and `rightsStatus: "unknown"`.

## Session (pure)

```text
offline --dial(board)--> dialing --connected()--> login --handle--> menu
menu --letter--> area --number--> item --Q--> area --Q--> menu --G--> offline
item (files) --T--> effect { download }
```

`submit(state, catalog, line)` returns the next state plus effects for the
UI to perform: `logged-in`, `opened-area`, `download`, `hangup`. `render`
draws an 80-column screen; the connect speed and download times come from
the machine's Computer Engine profile (`CONNECT 14400`, « 8,7 s à 14 400
bit/s »).

## One phone line

The app shares the machine's modem with the Time Browser
(`useNetworkConnection`): calling a board dials (`modem-dialup-v32` cue),
the board answers once the handshake has played, `G` or the tray icon hangs
up (`NO CARRIER`), and calling while the line is already online is refused
as « Ligne occupée ». A download's real duration is computed on the modem
and replayed ×10 faster, which the screen states; the file then lands in
`C:\BBS\DOWNLOAD` for the file manager, notepad and terminal.

## Story

Logging in, opening an area and downloading emit `service.opened` (see
`docs/narrative-engine.md`), which earns the 1992 passport stamps.
