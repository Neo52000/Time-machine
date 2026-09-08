import { describe, expect, it } from "vitest";
import { EraManifestSchema } from "@time-machine/content-schema";
import { eraManifests } from "./manifests";
import { getEra, getEraOrThrow, listEras } from "./registry";

describe("era-engine manifests", () => {
  it("loads and validates all seed manifests", () => {
    expect(eraManifests).toHaveLength(3);
    for (const manifest of eraManifests) {
      expect(() => EraManifestSchema.parse(manifest)).not.toThrow();
    }
  });

  it("rejects a manifest missing required fields", () => {
    const invalid = { id: "broken", label: "Broken era" };
    expect(() => EraManifestSchema.parse(invalid)).toThrow();
  });
});

describe("era-engine registry", () => {
  it("lists eras sorted by dateStart", () => {
    const eras = listEras();
    const ids = eras.map((era) => era.id);
    expect(ids).toEqual(["1985", "1998", "2005"]);
  });

  it("gets an era by id", () => {
    const era = getEra("1998");
    expect(era?.label).toContain("1998");
  });

  it("returns undefined for an unknown era id", () => {
    expect(getEra("1975")).toBeUndefined();
  });

  it("getEraOrThrow throws for an unknown era id", () => {
    expect(() => getEraOrThrow("1975")).toThrow(/Unknown era/);
  });
});
