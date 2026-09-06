import type { EraManifest } from "@time-machine/content-schema";
import { eraManifests } from "./manifests";

export function listEras(): EraManifest[] {
  return [...eraManifests].sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}

export function getEra(id: string): EraManifest | undefined {
  return eraManifests.find((era) => era.id === id);
}

export function getEraOrThrow(id: string): EraManifest {
  const era = getEra(id);
  if (!era) {
    throw new Error(`Unknown era: "${id}"`);
  }
  return era;
}
