import { createMachineCatalog } from "./catalog";

import machines from "../../../content/machines/machines.json";
import sources from "../../../content/sources/sources.json";

/** Validated at module load so a malformed profile fails the build, not the desktop. */
export const machineCatalog = createMachineCatalog({ machines, sources });
