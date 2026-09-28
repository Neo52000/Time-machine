import { createBbsCatalog } from "./catalog";

import boards from "../../../content/bbs/boards.json";
import sources from "../../../content/sources/sources.json";

/** Validated at module load so a malformed board fails the build, not the call. */
export const bbsCatalog = createBbsCatalog({ boards, sources });
