# Time Search (Phase 6 — implemented)

Package: `packages/search-engine`. Surfaces: the `search-results` block of
reconstructed pages (AltaVista, Google, Yahoo!, Excite, Wikipédia, YouTube),
rendered by `apps/web/components/apps/browser/ReconstructedPage.tsx`.

## Principle

A search is always evaluated **at the machine's simulated date**. The index
holds every document with its availability window (`availableFrom`,
`availableUntil`); `search()` applies `isAvailableAt` before scoring, so a
site that does not exist yet (Napster in 1998) or no longer exists (Napster
in 2005) never appears — no "results from the future".

## Index

`documentsFromCatalog(timeWebCatalog)` derives `SearchDocument`s from the
Time Web catalogue so the index can never disagree with the browser:

- every `HistoricalWebsite` → one document (`site:<id>`), enriched with the
  text of its reconstructed home page (headings, paragraphs, link labels);
- every reconstructed sub-page → one document (`page:<id>`) with the page's
  URL; result pages (those with a `search-results` block) are skipped.

`createSearchIndex(docs)` builds an inverted index (token → document →
per-field counts). Duplicate ids fail at load time.

## Query syntax (1990s style)

```text
+mot        obligatoire
-mot        exclu
"a b c"     expression exacte
mot         optionnel — plus un document couvre de mots, mieux il est classé
```

Tokenisation: lowercase, accents stripped ("réseau" = "reseau"), split on
non-alphanumerics, short French/English stop-word list.

## Ranking (explainable on purpose)

```text
score = Σ_terms  weight(field) × (1 + ln(tf))      title 3 · keywords 2 · description 1
      + 2 × (matched terms / query terms)          coverage bonus
      + 4 × number of exact phrases
```

Ties break on title (French collation). `limit` / `offset` paginate; the
response carries `total`.

## Providers

`EraManifest.searchProvider` selects a `SearchProvider` (label, tagline,
results per page) — `time-search-1998`, `time-search-2005`; unknown ids
fall back to the 1998 presentation. The index and the temporal filter are
shared across eras.

## In the browser

When the resolved reconstruction contains a `search-results` block, the
Time Browser reads the block's `paramName` from the URL query, runs
`search(timeSearchIndex, { query, selectedDate, limit })`, and renders the
hits inside the page. Each hit links to the document URL and goes back
through `resolveHistoricalUrl`, so clicking a result behaves exactly like
typing its address.
