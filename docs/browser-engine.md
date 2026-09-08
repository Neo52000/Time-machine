# Browser Engine (Phase 4 — not yet implemented)

Status: **not started.** This document captures the design intent from the
master build prompt so implementation can start directly from it.

## Goal

An internal, simulated browser (address bar, back/forward, history,
bookmarks, error pages) that never depends on the real browser's navigation
and never renders untrusted remote content directly.

## Planned resolution flow (Time Web Engine, §12)

```text
1. Reconstruction interactive locale
2. Snapshot historique préparé
3. Archive distante autorisée
4. Capture ou document historique
5. Fiche documentaire
6. 404 temporelle
```

`resolveHistoricalUrl({ url, selectedDate })` will return one of:

```ts
type HistoricalUrlResolution =
  | { type: "reconstruction"; resourceId: string }
  | { type: "archive"; archiveUrl: string }
  | { type: "snapshot"; snapshotId: string }
  | { type: "document"; eventId: string }
  | { type: "not-found" };
```

Internet Archive is a **documentary source**, never the primary rendering
engine (see `docs/rights-policy.md`).

## Security constraints (must hold from day one of implementation)

- No arbitrary remote script execution inside the internal browser.
- Sanitize all rendered historical content.
- Use allowlists, isolated rendering (e.g. sandboxed iframe with a strict
  CSP), no remote script tags, Zod-validated content at every boundary.
