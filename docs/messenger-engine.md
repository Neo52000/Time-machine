# Messenger Engine (Phase 8 — implemented)

Package: `packages/messenger-engine`. UI: `apps/web/components/apps/MessengerApp.tsx`.
Content: `content/messenger/`.

## Principle

Every contact, presence change and line of dialogue is data. The engine
never generates a reply: opening a conversation replays a fixed script,
the way a recorded IM session would. Typing something yourself appends it
to the log immediately but does not alter the script — the atmosphere,
not a chatbot, is the point.

## Two clocks

```text
SessionState.elapsedMs                since the session started — drives background
                                       presence changes (PresenceEvent.afterMs), so a
                                       contact can sign in while you're chatting with
                                       someone else
ConversationRuntime.elapsedMs         since that conversation was opened — drives its
                                       own script (MessengerMessage.delayMs / typingMs)
```

`tick(state, catalog, deltaMs)` advances both and is pure: the UI owns the
real `setInterval` and calls it every 200 ms, so the whole reveal/typing/
presence logic is unit-tested without waiting on anything.

## Data model (`packages/content-schema/src/messenger.ts`)

- `MessengerContact` — id, name, `avatarInitial`, initial `status`
  (`online` / `away` / `busy` / `offline`), optional `statusMessage`.
- `MessengerConversation` — one per contact (enforced by the catalogue: a
  contact with no conversation can be listed but not opened), a list of
  `MessengerMessage`.
- `MessengerMessage` — `from: "me" | "contact"`, `text`, `delayMs` (since
  the previous reveal), `typingMs` (contact messages only: how long "is
  typing…" shows right before the message appears).
- `PresenceEvent` — `contactId`, `afterMs` (since session start), the new
  `status`/`statusMessage`. Lets a contact go online mid-session even if
  their conversation is never opened.

`createMessengerCatalog` validates every record and checks referential
integrity: a conversation's `contactId` must exist, a contact may not have
two conversations, a presence event must target a real contact.

## Content

`content/messenger/contacts.json` (Julie — the scripted conversation,
Marc — offline then comes online via a presence event, PapaMaman — away
with no conversation, Service Messenger — a short onboarding script) and
`conversations.json` / `presence-events.json`. All fictional, in the spirit
of 2005 instant messaging.

## Adding a contact or conversation

1. Add the contact to `contacts.json`.
2. Optionally add one `MessengerConversation` for them in
   `conversations.json`, its `messages` timed with `delayMs`/`typingMs`.
3. Optionally add `PresenceEvent`s in `presence-events.json` for background
   status changes.
4. `pnpm --filter @time-machine/messenger-engine test` catches any dangling
   reference or duplicate conversation.
