import { createPhoneCatalog } from "./catalog";

import phone from "../../../content/phone/phone.json";
import sources from "../../../content/sources/sources.json";

/** Validated at module load so malformed phone content fails the build, not the call. */
export const phoneCatalog = createPhoneCatalog({ phone, sources });
