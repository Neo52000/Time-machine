import type { EraManifest } from "@time-machine/content-schema";

/**
 * Application Runtime — the catalogue of applications the desktop can run.
 *
 * An `AppDefinition` is UI-agnostic metadata: which app exists, how its
 * window should open, and in which eras it is allowed. The React component
 * that renders an app lives in `apps/web` and is looked up by `id`.
 * Era manifests (`eras/<id>/manifest.json`) decide which apps are exposed;
 * the registry never hard-codes an era.
 */
export interface AppDefinition {
  id: string;
  title: string;
  /** Short glyph used for desktop icons and title bars (era themes may override). */
  icon: string;
  defaultSize: { width: number; height: number };
  /** Only one window of this app can be open at a time. */
  singleton: boolean;
  /**
   * Eras in which the app is available. `undefined` = any era whose manifest
   * lists it. Used to catch manifests that request an app it cannot render.
   */
  eras?: string[];
}

export interface AppRegistry {
  register(app: AppDefinition): void;
  get(id: string): AppDefinition | undefined;
  has(id: string): boolean;
  list(): AppDefinition[];
}

export function createAppRegistry(initial: AppDefinition[] = []): AppRegistry {
  const apps = new Map<string, AppDefinition>();
  const registry: AppRegistry = {
    register(app) {
      if (apps.has(app.id)) {
        throw new Error(`App "${app.id}" is already registered`);
      }
      apps.set(app.id, app);
    },
    get: (id) => apps.get(id),
    has: (id) => apps.has(id),
    list: () => [...apps.values()],
  };
  for (const app of initial) registry.register(app);
  return registry;
}

export interface EraAppResolution {
  /** Apps to show on the desktop, in the manifest's order. */
  apps: AppDefinition[];
  /** App ids the manifest asked for but the runtime cannot provide. */
  missing: string[];
}

/**
 * Resolve the app ids of an era manifest against the registry. Unknown or
 * era-restricted apps are reported in `missing` rather than thrown, so a
 * partially supported era still boots with what it has.
 */
export function resolveEraApps(registry: AppRegistry, era: EraManifest): EraAppResolution {
  const apps: AppDefinition[] = [];
  const missing: string[] = [];
  for (const appId of era.apps) {
    const app = registry.get(appId);
    if (!app || (app.eras && !app.eras.includes(era.id))) {
      missing.push(appId);
      continue;
    }
    apps.push(app);
  }
  return { apps, missing };
}
