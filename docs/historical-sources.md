# Historical sources

Every `HistoricalEvent`, `HistoricalWebsite`, and `HistoricalSnapshot` must
trace back to at least one `SourceReference` (`content/sources/sources.json`).

## Current state (MVP seed)

The seed data in `content/events/events.json` uses general reference
sources (mainly Wikipedia and the W3C history page) rather than primary
sources. This is intentional for a technical MVP but is **not** the final
sourcing standard for the product:

- Events with `needsResearch: true` need their exact date confirmed against
  a primary or authoritative secondary source before that flag is cleared.
- Long-term, prefer primary sources: contemporary press archives, official
  company blogs/announcements, archived snapshots (Internet Archive used as
  a _reference_, never as the rendering engine — see `docs/browser-engine.md`),
  academic histories.

## Process for adding a sourced fact

1. Find the source; add a `SourceReference` entry to
   `content/sources/sources.json` with a real `url` and `publisher`.
2. Reference its `id` from the `sourceIds` array of the event/website/snapshot.
3. If you cannot verify a specific date/detail with confidence, set
   `needsResearch: true` — never invent precision you don't have.
4. The (future) admin app will surface a "NEEDS RESEARCH" queue (§26 of the
   master prompt) for exactly this reason.
