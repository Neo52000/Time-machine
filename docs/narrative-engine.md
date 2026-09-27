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

| Event              | Emitted by                         | Data                           |
| ------------------ | ---------------------------------- | ------------------------------ |
| `era.loaded`       | Desktop, when boot completes       | `eraId`                        |
| `file.opened`      | Notepad, terminal `TYPE`           | `path`, `name`                 |
| `site.visited`     | Time Browser, each resolution      | `domain`, `type`, `reason`     |
| `search.executed`  | Time Browser, non-empty query      | `query`, `results`, `provider` |
| `message.received` | Messenger, incoming message        | `contactId`                    |
| `service.opened`   | Minitel, each newly opened service | `kiosk`, `service`             |

## Actions performed today

`show.notification` (tray balloon, polite live region, auto-dismiss 8 s,
click-through except its close button), `create.file` (added to the virtual
disk through `desktop-engine`'s `addTextFile` — never overwrites a file),
`play.sound` (through the era's sound bindings), `set.flag`.

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
