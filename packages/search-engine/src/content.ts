import { timeWebCatalog } from "@time-machine/browser-engine";
import { documentsFromCatalog } from "./documents";
import { createSearchIndex } from "./search";

/** Built once from the validated catalogue; duplicate ids fail at load time. */
export const timeSearchIndex = createSearchIndex(documentsFromCatalog(timeWebCatalog));
