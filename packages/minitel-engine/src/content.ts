import { createMinitelCatalog } from "./catalog";

import kiosks from "../../../content/minitel/kiosks.json";
import services from "../../../content/minitel/services.json";
import datasets from "../../../content/minitel/datasets.json";
import sources from "../../../content/sources/sources.json";
import demoPages from "../../../content/minitel/pages/demo.json";
import tempsPages from "../../../content/minitel/pages/temps.json";
import balPages from "../../../content/minitel/pages/bal.json";
import annuairePages from "../../../content/minitel/pages/annuaire.json";

/** Validated at module load; a dangling id fails the tests, never the UI. */
export const minitelCatalog = createMinitelCatalog({
  kiosks,
  services,
  pages: [...demoPages, ...tempsPages, ...balPages, ...annuairePages],
  datasets,
  sources,
});
