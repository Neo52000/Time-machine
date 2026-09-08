import { describe, expect, it } from "vitest";
import type { EraManifest } from "@time-machine/content-schema";
import { builtinApps } from "./builtin";
import { createAppRegistry, resolveEraApps, type AppDefinition } from "./registry";

const era1998: EraManifest = {
  id: "1998",
  label: "1998",
  dateStart: "1998-01-01",
  dateEnd: "1998-12-31",
  machine: {
    id: "pc-1998",
    resolution: { width: 800, height: 600 },
    bootSequence: "pc-1998-boot",
    theme: "beige-crt-1998",
  },
  apps: ["browser", "file-manager", "notepad", "terminal", "mail"],
  network: { web: true, minitel: false, bbs: true, messenger: false },
  timelineTags: [],
};

const sampleApp: AppDefinition = {
  id: "sample",
  title: "Sample",
  icon: "S",
  defaultSize: { width: 100, height: 100 },
  singleton: false,
};

describe("createAppRegistry", () => {
  it("registers and looks up apps", () => {
    const registry = createAppRegistry([sampleApp]);
    expect(registry.has("sample")).toBe(true);
    expect(registry.get("sample")?.title).toBe("Sample");
    expect(registry.get("nope")).toBeUndefined();
    expect(registry.list()).toHaveLength(1);
  });

  it("rejects duplicate ids", () => {
    const registry = createAppRegistry([sampleApp]);
    expect(() => registry.register(sampleApp)).toThrow(/already registered/);
  });

  it("builtin app ids are unique", () => {
    const ids = builtinApps.map((app) => app.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("resolveEraApps", () => {
  it("returns the 1998 apps in manifest order with nothing missing", () => {
    const registry = createAppRegistry(builtinApps);
    const { apps, missing } = resolveEraApps(registry, era1998);
    expect(apps.map((a) => a.id)).toEqual(era1998.apps);
    expect(missing).toEqual([]);
  });

  it("reports unknown apps instead of throwing", () => {
    const registry = createAppRegistry(builtinApps);
    const { apps, missing } = resolveEraApps(registry, { ...era1998, apps: ["notepad", "ghost"] });
    expect(apps.map((a) => a.id)).toEqual(["notepad"]);
    expect(missing).toEqual(["ghost"]);
  });

  it("reports era-restricted apps requested by the wrong era", () => {
    const registry = createAppRegistry(builtinApps);
    const { apps, missing } = resolveEraApps(registry, { ...era1998, apps: ["minitel"] });
    expect(apps).toEqual([]);
    expect(missing).toEqual(["minitel"]);
  });
});
