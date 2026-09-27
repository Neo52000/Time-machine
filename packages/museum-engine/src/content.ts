import { timeWebCatalog } from "@time-machine/browser-engine";
import { machineCatalog } from "@time-machine/computer-engine";
import { listEras } from "@time-machine/era-engine";
import { buildMuseum } from "./museum";

/** Derived from the already-validated catalogues: the museum has no content of its own. */
export const museum = buildMuseum({
  eras: listEras(),
  events: timeWebCatalog.events,
  websites: timeWebCatalog.websites,
  machines: machineCatalog.machines,
  sources: timeWebCatalog.sources,
});
