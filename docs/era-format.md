# Era format

An era is described by an `EraManifest` (schema: `packages/content-schema/src/era.ts`),
stored as `eras/<id>/manifest.json` and validated at load time by
`packages/era-engine` (`EraManifestSchema.parse`, fail-fast on invalid data).

```ts
export interface EraManifest {
  id: string;
  label: string;
  dateStart: string; // ISO date, YYYY-MM-DD
  dateEnd: string;

  machine: {
    id: string;
    resolution: { width: number; height: number };
    bootSequence: string; // key resolved by the (future) boot experience
    theme: string; // key resolved by the (future) theming layer
  };

  apps: string[]; // app ids available in this era — not all apps exist in every era

  network: {
    web: boolean;
    minitel: boolean;
    bbs: boolean;
    messenger: boolean;
  };

  searchProvider?: string;
  browser?: string;

  timelineTags: string[];
}
```

## Adding a new era

1. Create `eras/<id>/manifest.json` conforming to the schema above.
2. Register it in `packages/era-engine/src/manifests.ts` (static import + push
   into `rawManifests`).
3. Add a unit test in `packages/era-engine/src/registry.test.ts` asserting it
   loads and validates.
4. No component should ever import the JSON directly — always go through
   `getEra(id)` / `listEras()`.

## Current eras (MVP)

- **1985** — Minitel only (`network.minitel`, no web).
- **1998** — desktop + browser + search + basic apps (browser, file-manager,
  notepad, terminal, mail).
- **2005** — desktop + browser + messenger + media-player + search, all implemented.
