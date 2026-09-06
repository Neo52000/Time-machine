import { EraManifestSchema, type EraManifest } from "@time-machine/content-schema";

import era1985 from "../../../eras/1985/manifest.json";
import era1998 from "../../../eras/1998/manifest.json";
import era2005 from "../../../eras/2005/manifest.json";

const rawManifests: unknown[] = [era1985, era1998, era2005];

/**
 * Validated at module load so a malformed manifest fails fast at build/boot
 * time rather than surfacing as a runtime bug deep in the UI.
 */
export const eraManifests: EraManifest[] = rawManifests.map((raw) => EraManifestSchema.parse(raw));
