import {
  MinitelDatasetSchema,
  MinitelKioskSchema,
  MinitelPageSchema,
  MinitelServiceSchema,
  SourceReferenceSchema,
  type MinitelAction,
  type MinitelDataset,
  type MinitelKiosk,
  type MinitelPage,
  type MinitelService,
  type SourceReference,
} from "@time-machine/content-schema";

export interface MinitelData {
  kiosks: unknown[];
  services: unknown[];
  pages: unknown[];
  datasets: unknown[];
  sources: unknown[];
}

export interface MinitelCatalog {
  kiosks: MinitelKiosk[];
  services: MinitelService[];
  pages: MinitelPage[];
  datasets: MinitelDataset[];
  getKiosk(code: string): MinitelKiosk | undefined;
  getService(id: string): MinitelService | undefined;
  findService(kioskCode: string, mnemonic: string): MinitelService | undefined;
  getPage(id: string): MinitelPage | undefined;
  getDataset(id: string): MinitelDataset | undefined;
  getSource(id: string): SourceReference | undefined;
}

function actionsOf(page: MinitelPage): MinitelAction[] {
  const actions: MinitelAction[] = [];
  for (const block of page.blocks) {
    if (block.type === "menu") actions.push(...block.items.map((i) => i.action));
    if (block.type === "input") actions.push(block.action);
  }
  return actions;
}

/** Validates every record and checks referential integrity (fail fast). */
export function createMinitelCatalog(data: MinitelData): MinitelCatalog {
  const kiosks = data.kiosks.map((k) => MinitelKioskSchema.parse(k));
  const services = data.services.map((s) => MinitelServiceSchema.parse(s));
  const pages = data.pages.map((p) => MinitelPageSchema.parse(p));
  const datasets = data.datasets.map((d) => MinitelDatasetSchema.parse(d));
  const sources = data.sources.map((s) => SourceReferenceSchema.parse(s));

  const byId = <T extends { id: string }>(items: T[], kind: string) => {
    const map = new Map<string, T>();
    for (const item of items) {
      if (map.has(item.id)) throw new Error(`Duplicate ${kind} id "${item.id}"`);
      map.set(item.id, item);
    }
    return map;
  };
  const kioskByCode = new Map<string, MinitelKiosk>();
  for (const k of kiosks) {
    if (kioskByCode.has(k.code)) throw new Error(`Duplicate kiosk code "${k.code}"`);
    kioskByCode.set(k.code, k);
  }
  const serviceById = byId(services, "service");
  const pageById = byId(pages, "page");
  const datasetById = byId(datasets, "dataset");
  const sourceById = byId(sources, "source");

  const assertRef = (map: Map<string, unknown>, id: string, what: string, owner: string) => {
    if (!map.has(id)) throw new Error(`${owner} references unknown ${what} "${id}"`);
  };

  for (const k of kiosks) {
    for (const id of k.sourceIds) assertRef(sourceById, id, "source", `kiosk ${k.code}`);
    if (k.directServiceId) assertRef(serviceById, k.directServiceId, "service", `kiosk ${k.code}`);
  }
  const mnemonics = new Set<string>();
  for (const s of services) {
    assertRef(kioskByCode, s.kioskCode, "kiosk", `service ${s.id}`);
    assertRef(pageById, s.homePageId, "page", `service ${s.id}`);
    if (s.guidePageId) assertRef(pageById, s.guidePageId, "page", `service ${s.id}`);
    for (const id of s.sourceIds) assertRef(sourceById, id, "source", `service ${s.id}`);
    const key = `${s.kioskCode} ${s.mnemonic}`;
    if (mnemonics.has(key)) throw new Error(`Duplicate service mnemonic "${key}"`);
    mnemonics.add(key);
    if (!s.fictional && s.rightsStatus === "unknown") {
      throw new Error(`service ${s.id} is not fictional and has unknown rights`);
    }
  }
  for (const p of pages) {
    assertRef(serviceById, p.serviceId, "service", `page ${p.id}`);
    const service = serviceById.get(p.serviceId)!;
    for (const action of actionsOf(p)) {
      if (action.type === "goto" || action.type === "echo") {
        assertRef(pageById, action.pageId, "page", `page ${p.id}`);
        if (pageById.get(action.pageId)!.serviceId !== service.id) {
          throw new Error(`page ${p.id} links outside its service (${action.pageId})`);
        }
      } else {
        assertRef(datasetById, action.dataset, "dataset", `page ${p.id}`);
        const dataset = datasetById.get(action.dataset)!;
        const keys = new Set(dataset.rows.flatMap((r) => Object.keys(r)));
        for (const col of [action.field, ...action.columns]) {
          if (dataset.rows.length > 0 && !keys.has(col)) {
            throw new Error(`page ${p.id} uses unknown column "${col}" of dataset ${dataset.id}`);
          }
        }
      }
    }
  }
  for (const d of datasets) {
    for (const id of d.sourceIds) assertRef(sourceById, id, "source", `dataset ${d.id}`);
  }

  return {
    kiosks,
    services,
    pages,
    datasets,
    getKiosk: (code) => kioskByCode.get(code),
    getService: (id) => serviceById.get(id),
    findService: (kioskCode, mnemonic) =>
      services.find((s) => s.kioskCode === kioskCode && s.mnemonic === mnemonic),
    getPage: (id) => pageById.get(id),
    getDataset: (id) => datasetById.get(id),
    getSource: (id) => sourceById.get(id),
  };
}
