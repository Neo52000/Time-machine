import { createNarrativeCatalog } from "./catalog";

import triggers from "../../../content/narrative/triggers.json";

/** Validated at module load so a malformed trigger fails the build, not the story. */
export const narrativeCatalog = createNarrativeCatalog({ triggers });
