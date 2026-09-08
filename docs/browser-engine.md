# Browser Engine (Phase 4 — implemented)

Package: `packages/browser-engine`. UI: `apps/web/components/apps/BrowserApp.tsx`
and `apps/web/components/apps/browser/`.

## Goal

An internal, simulated browser (address bar, back/forward, history, error
pages) that never depends on the real browser's navigation and never renders
untrusted remote content. Nothing is fetched from the live Internet: every
address is resolved against the **Time Web catalogue** at the machine's
_simulated_ date.

## Resolution flow (master prompt §12)

`resolveHistoricalUrl(catalog, { url, selectedDate })` tries, in order:

```text
1. Reconstruction interactive locale   → { type: "reconstruction", pageId }
2. Snapshot historique préparé         → { type: "snapshot", snapshotId }   (screenshot / document)
3. Archive distante autorisée          → { type: "archive", archiveUrl }    (allow-list: web.archive.org)
4. Document historique                 → { type: "document", eventId }      (website.relatedEventIds)
5. Fiche documentaire                  → { type: "website-card", websiteId }
6. 404 temporelle                      → { type: "not-found", reason, eventIds }
```

`reason` is one of `invalid-url`, `domain-unknown`, `not-yet-online`,
`no-longer-online`, `page-unknown`. A temporal 404 carries the events that
explain it (e.g. napster.com in 1998 → "Lancement de Napster, 1999").

Eligibility rules, all enforced in the engine and covered by unit tests:

- A website is reachable only if `availableFrom <= selectedDate <= availableUntil`.
- A snapshot is eligible only if `capturedAt <= selectedDate` **and**
  `rightsStatus !== "unknown"` (see `docs/rights-policy.md`). Among eligible
  snapshots, the most recent wins within each step.
- Archive snapshots must point to an allow-listed host; anything else is
  ignored. Archives are shown as a documentary link that opens the real
  browser — never inline.
- Internet Archive is a **documentary source**, never the rendering engine.

## Time Web catalogue

`createTimeWebCatalog({ websites, snapshots, pages, events, sources })`
validates every record with the Zod schemas and checks referential
integrity (every `sourceIds`, `websiteId`, `relatedEventIds`, reconstruction
`contentRef` must exist). The default catalogue (`timeWebCatalog`) is built
at module load from:

```text
content/websites/websites.json          HistoricalWebsite
content/snapshots/snapshots.json        HistoricalSnapshot
content/reconstructions/*.json          ReconstructedPage
content/events/events.json              HistoricalEvent
content/sources/sources.json            SourceReference
```

## Reconstructions are data, not HTML

A `ReconstructedPage` (`packages/content-schema/src/reconstruction.ts`) is a
list of typed blocks — `heading`, `paragraph`, `links`, `search-form`,
`search-results`, `list`, `notice`, `divider` — rendered by
`ReconstructedPageView`. There is no HTML string, no
`dangerouslySetInnerHTML`, no script: a content file cannot execute
anything. Links inside a page are resolved relative to the page's URL and
go back through the engine, so a link to a site that does not exist yet
lands on a temporal 404.

Reconstructions are **original, era-inspired** pages (`rightsStatus:
"original"`, source `src-timemachine-reconstruction`): layout and copy are
ours; no brand chrome, logo or artwork is reproduced.

## URL handling

`normalizeUrl` accepts what a 1998 user types (`altavista.com`,
`www.yahoo.com/`, `http://google.com`), forces `http://`, lowercases the
host, parses the query string, and rejects non-web schemes
(`javascript:`, `ftp:`) and hostless input. `about:` pages are internal
(`about:home` is the start page). Address-bar input is always absolute;
only in-page links are resolved relative to the current page.

## History

`createBrowserHistory` / `navigateTo` / `goBack` / `goForward` are pure
functions (unit-tested); navigating from the middle of the stack discards
the forward entries.

## Adding a site

1. Add a `HistoricalWebsite` to `content/websites/websites.json` with sourced
   `availableFrom` (`needsResearch: true` if not confirmed to the day) and
   `relatedEventIds` when an event documents it.
2. Optionally add a `ReconstructedPage` JSON in `content/reconstructions/`
   (path `/` for the home page), register it in
   `packages/browser-engine/src/content.ts`, and add a
   `HistoricalSnapshot` of type `reconstruction` pointing to it.
3. Run `pnpm --filter @time-machine/browser-engine test`: the catalogue test
   fails on any dangling reference or unknown-rights snapshot.
