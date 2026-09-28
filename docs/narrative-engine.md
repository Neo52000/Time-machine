# Narrative Engine

Package: `packages/narrative-engine`. Data: `content/narrative/triggers.json`.
Schema: `NarrativeTriggerSchema` (`packages/content-schema/src/narrative.ts`).
Runtime: `apps/web/lib/narrative/NarrativeProvider.tsx`.

## Model

A trigger listens for things the user does and, once **all** of its
conditions have been seen (in any order, accumulated across events) and its
`requiresFlags` are set, performs its actions.

```json
{
  "id": "explorer-1998",
  "eras": ["1998"],
  "when": [{ "event": "site.visited" }, { "event": "search.executed" }, { "event": "file.opened" }],
  "actions": [
    { "type": "set.flag", "payload": { "flag": "explorer-1998" } },
    {
      "type": "create.file",
      "payload": { "path": "/Mes Documents/Carnet de voyage.txt", "content": "…" }
    },
    { "type": "show.notification", "payload": { "title": "Nouveau document", "body": "…" } }
  ],
  "once": true
}
```

- `eras` omitted = every era. `once: false` re-arms the trigger after it fires.
- `match` compares scalars: strings trimmed and case-insensitive, numbers and
  booleans strictly (`"0"` never matches `0`).
- String payload fields accept `{key}` placeholders filled from the firing
  event's data; an unknown key stays visible rather than being blanked.
- A `set.flag` can release a flag-gated trigger in the same dispatch
  (evaluation loops until stable, each trigger fires at most once per dispatch).

`dispatch(triggers, state, event)` is pure: it returns the new state, the
actions to perform (placeholders filled) and the ids that fired.

## Events emitted today

| Event              | Emitted by                                 | Data                                                                                        |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `era.loaded`       | Desktop, when boot completes               | `eraId`                                                                                     |
| `file.opened`      | Notepad, terminal `TYPE`                   | `path`, `name`                                                                              |
| `site.visited`     | Time Browser, each resolution              | `domain`, `type`, `reason`                                                                  |
| `search.executed`  | Time Browser, non-empty query              | `query`, `results`, `provider`                                                              |
| `message.received` | Messenger, incoming message                | `contactId`                                                                                 |
| `service.opened`   | Minitel, each newly opened service         | `kiosk`, `service`                                                                          |
| `service.opened`   | Terminal BBS (1992): login, area, download | `kiosk` = `bbs` / `bbs-area` / `bbs-download`, `service` = board id / area kind / file name |
| `media.played`     | Media player, play pressed                 | `clipId`                                                                                    |

## Actions performed today

`show.notification` (tray balloon, polite live region, auto-dismiss 8 s,
click-through except its close button), `create.file` (added to the virtual
disk through `desktop-engine`'s `addTextFile` — never overwrites a file),
`play.sound` (through the era's sound bindings), `set.flag`, and:

- `send.message` — a Messenger contact "writes" (the message is merged into
  that contact's conversation; no chatbot, the text is content).
- `change.desktop` — a reward wallpaper colour (`#rrggbb`) for the session.
- `award.stamp` — stamps the visitor's **passport** (below).

## Passport (stamps)

`content/narrative/stamps.json` lists small achievements per era (id, era,
title, hint, icon). A trigger awards one with `award.stamp`; the engine also
sets the flag `stamp:<id>`, so a reward trigger can `requiresFlags` every
stamp of an era. Stamps are kept in the visitor's browser
(`apps/web/lib/narrative/passport.ts`, key `time-machine-passport`, never
sent anywhere) and shown on the homepage: earned stamps in colour, missing
ones as a hint. A new session is seeded with the flags of stamps already
earned, so an era reward also unlocks for a returning visitor; a stamp is
celebrated with a balloon only the first time. The catalogue refuses a stamp
no trigger awards, an award of an unknown stamp, and an award outside the
stamp's era.

| Era  | Stamps                                                                            | Reward                 |
| ---- | --------------------------------------------------------------------------------- | ---------------------- |
| 1985 | first service, directory (3611), 3614 BAL, DEMO + TEMPS + FUTUR                   | —                      |
| 1992 | first BBS login, a forum message, a download, info.cern.ch, a site not yet online | wallpaper « Sarcelle » |
| 1998 | first connection, a temporal 404, a search, info.cern.ch, the travel log          | wallpaper « Voyageur » |
| 2005 | a Messenger message, a video, the free encyclopedia, the 2005 log                 | wallpaper « Prairie »  |

## Fail fast

The schema keeps the full contract (`event.viewed`, `time.changed`,
`unlock.site`, `send.message`, `change.desktop`, `unlock.era`) for the
future, but `createNarrativeCatalog` **refuses** a trigger that waits for an
event nothing emits, uses an action nothing performs, or requires a flag no
trigger sets. A story can therefore never silently do nothing. Supporting a
new event/action = emit/perform it, then add it to `EMITTED_EVENTS` /
`PERFORMED_ACTIONS`.

Story content is meta and fictional (greetings, hints, a travel log); it
never asserts a historical fact the sourced content doesn't already carry.
