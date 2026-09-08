/**
 * Search providers are keyed by `EraManifest.searchProvider`. They shape the
 * *presentation* of results for an era (label, page size, tagline); the
 * index and the temporal filter are shared.
 */
export interface SearchProvider {
  id: string;
  label: string;
  tagline: string;
  resultsPerPage: number;
}

const providers: Record<string, SearchProvider> = {
  "time-search-1998": {
    id: "time-search-1998",
    label: "Time Search 98",
    tagline: 'Index plein texte daté — syntaxe +mot, -mot, "expression exacte".',
    resultsPerPage: 10,
  },
  "time-search-2005": {
    id: "time-search-2005",
    label: "Time Search 2005",
    tagline: "Résultats filtrés à la date de la machine.",
    resultsPerPage: 10,
  },
};

export function getSearchProvider(id: string | undefined): SearchProvider {
  return (id && providers[id]) || { ...providers["time-search-1998"]!, id: id ?? "time-search" };
}
