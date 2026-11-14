# Historical sources

Every `HistoricalEvent`, `HistoricalWebsite`, and `HistoricalSnapshot` must
trace back to at least one `SourceReference` (`content/sources/sources.json`).

## Source kinds

Every `SourceReference` has a `kind` (`packages/content-schema/src/source.ts`):

| Kind            | What it is                                                                                      | Supports a date? |
| --------------- | ----------------------------------------------------------------------------------------------- | ---------------- |
| `primary`       | The actor at the time: announcement, original post, the standard itself, archived original page | yes              |
| `institutional` | Museums, standards bodies, governments, official texts, universities                            | yes              |
| `press`         | Reputable press, contemporary or retrospective                                                  | yes              |
| `reference`     | Encyclopedias (Wikipedia, Britannica, Encyclopedia.com…), Web Design Museum                     | context only     |
| `project`       | Written by Time Machine (fiction, reconstruction, representative profile)                       | no               |

The museum shows the kind next to each source and, per gallery, how many
dated facts rest on a `primary`/`institutional`/`press` source.
`packages/browser-engine/src/sourcing.test.ts` enforces that encyclopedias
are filed as `reference` and holds a **ratchet** on events and sites that
lack an authoritative source: it may only go down.

## Current state (Phase 15)

76 of 78 dated facts (events + sites) cite at least one primary,
institutional or press source; `yahoo-com` and `myspace-com` still rest on
encyclopedias only. The Phase 15 sources were found by web search without
opening the pages, so **no `needsResearch` flag was cleared**:
`docs/source-review.md` lists every added source with what the search
summary said, the three date conflicts found (Minitel, Yahoo!, Myspace) and
the wording corrections proposed. A human opens each URL and clears the
flag in `apps/admin`.

## Process for adding a sourced fact

1. Find the source; add a `SourceReference` entry to
   `content/sources/sources.json` with a real `url`, `publisher`, `kind` and
   `accessedAt`. Prefer `primary`, then `institutional`, then `press`.
2. Reference its `id` from the `sourceIds` array of the event/website/snapshot.
3. If you cannot verify a specific date/detail with confidence, set
   `needsResearch: true` — never invent precision you don't have.
4. The (future) admin app will surface a "NEEDS RESEARCH" queue (§26 of the
   master prompt) for exactly this reason.
