import { createTimeWebCatalog } from "./catalog";

import websites from "../../../content/websites/websites.json";
import snapshots from "../../../content/snapshots/snapshots.json";
import events from "../../../content/events/events.json";
import sources from "../../../content/sources/sources.json";
import altavistaHome from "../../../content/reconstructions/altavista-1998-home.json";
import altavistaSearch from "../../../content/reconstructions/altavista-1998-search.json";
import yahooHome from "../../../content/reconstructions/yahoo-1998-home.json";
import googleHome from "../../../content/reconstructions/google-1998-home.json";
import googleSearch from "../../../content/reconstructions/google-1998-search.json";
import geocitiesHome from "../../../content/reconstructions/geocities-1998-home.json";
import cernHome from "../../../content/reconstructions/info-cern-ch-1991-home.json";

/**
 * Validated at module load so malformed or dangling content fails the
 * build/tests rather than surfacing inside the browser window.
 */
export const timeWebCatalog = createTimeWebCatalog({
  websites,
  snapshots,
  pages: [
    altavistaHome,
    altavistaSearch,
    yahooHome,
    googleHome,
    googleSearch,
    geocitiesHome,
    cernHome,
  ],
  events,
  sources,
});
