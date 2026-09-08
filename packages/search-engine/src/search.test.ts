import { describe, expect, it } from "vitest";
import { timeWebCatalog } from "@time-machine/browser-engine";
import type { SearchDocument } from "@time-machine/content-schema";
import { timeSearchIndex } from "./content";
import { documentsFromCatalog } from "./documents";
import { getSearchProvider } from "./providers";
import { parseQuery } from "./query";
import { createSearchIndex, search } from "./search";
import { normalizeText, tokenize } from "./tokenize";

describe("tokenize", () => {
  it("lowercases, strips accents and drops stop-words", () => {
    expect(normalizeText("Réseau Téléphonique")).toBe("reseau telephonique");
    expect(tokenize("Le réseau, la Toile et les MODEMS 56k !")).toEqual([
      "reseau",
      "toile",
      "modems",
      "56k",
    ]);
  });
});

describe("parseQuery", () => {
  it('understands +required, -excluded and "phrases"', () => {
    const q = parseQuery('+modem -minitel "moteur de recherche" annuaire');
    expect(q.required).toEqual(["modem"]);
    expect(q.excluded).toEqual(["minitel"]);
    expect(q.phrases).toEqual(["moteur de recherche"]);
    expect(q.optional).toEqual(["annuaire"]);
    expect(q.empty).toBe(false);
  });

  it("flags empty or stop-word-only queries", () => {
    expect(parseQuery("").empty).toBe(true);
    expect(parseQuery("le la de").empty).toBe(true);
    expect(parseQuery('""').empty).toBe(true);
  });
});

const docs: SearchDocument[] = [
  {
    id: "altavista",
    title: "AltaVista",
    description: "Moteur de recherche plein texte",
    keywords: ["search", "moteur"],
    availableFrom: "1995-12-15",
  },
  {
    id: "yahoo",
    title: "Yahoo!",
    description: "Annuaire hiérarchique du Web",
    keywords: ["directory", "annuaire", "portail"],
    availableFrom: "1995-01-18",
  },
  {
    id: "napster",
    title: "Napster",
    description: "Partage de fichiers MP3",
    keywords: ["mp3", "musique"],
    availableFrom: "1999-06-01",
    availableUntil: "2001-07-01",
  },
  {
    id: "modem-page",
    title: "Tout sur le modem 56k",
    description: "Comment régler un modem pour surfer plus vite",
    keywords: ["modem", "56k"],
    availableFrom: "1998-01-01",
  },
];
const index = createSearchIndex(docs);
const at = (query: string, selectedDate = "1998-06-15", extra = {}) =>
  search(index, { query, selectedDate, ...extra });

describe("search", () => {
  it("returns nothing for an empty query", () => {
    expect(at("").hits).toEqual([]);
    expect(at("   ").total).toBe(0);
  });

  it("filters by the selected date (temporal search)", () => {
    expect(at("napster").hits).toEqual([]);
    expect(at("napster", "2000-01-01").hits.map((h) => h.document.id)).toEqual(["napster"]);
    expect(at("napster", "2005-01-01").hits).toEqual([]);
  });

  it("ranks title matches above description matches", () => {
    const hits = at("modem").hits.map((h) => h.document.id);
    expect(hits[0]).toBe("modem-page");
  });

  it("matches accented queries against unaccented text and vice versa", () => {
    expect(at("réglér").hits.map((h) => h.document.id)).toEqual(["modem-page"]);
    expect(at("hierarchique").hits.map((h) => h.document.id)).toEqual(["yahoo"]);
  });

  it("honours +required and -excluded terms", () => {
    expect(
      at("moteur annuaire")
        .hits.map((h) => h.document.id)
        .sort(),
    ).toEqual(["altavista", "yahoo"]);
    expect(at("+annuaire moteur").hits.map((h) => h.document.id)).toEqual(["yahoo"]);
    expect(at("moteur annuaire -yahoo").hits.map((h) => h.document.id)).toEqual(["altavista"]);
  });

  it("honours exact phrases", () => {
    expect(at('"moteur de recherche"').hits.map((h) => h.document.id)).toEqual(["altavista"]);
    expect(at('"recherche de moteur"').hits).toEqual([]);
  });

  it("rewards covering more query terms", () => {
    const hits = at("modem surfer 56k").hits;
    expect(hits[0]?.document.id).toBe("modem-page");
    expect(hits[0]?.matchedTerms).toEqual(["modem", "surfer", "56k"]);
  });

  it("paginates with limit and offset while reporting the total", () => {
    const page1 = at("moteur annuaire modem", "1998-06-15", { limit: 2 });
    expect(page1.total).toBe(3);
    expect(page1.hits).toHaveLength(2);
    const page2 = at("moteur annuaire modem", "1998-06-15", { limit: 2, offset: 2 });
    expect(page2.hits).toHaveLength(1);
  });

  it("produces a snippet from the description", () => {
    expect(at("yahoo").hits[0]?.snippet).toBe("Annuaire hiérarchique du Web");
  });

  it("rejects duplicate document ids", () => {
    expect(() => createSearchIndex([docs[0]!, docs[0]!])).toThrow(/Duplicate/);
  });
});

describe("documents from the Time Web catalogue", () => {
  const derived = documentsFromCatalog(timeWebCatalog);

  it("indexes every website plus non-home, non-results pages", () => {
    const ids = derived.map((d) => d.id);
    for (const site of timeWebCatalog.websites) expect(ids).toContain(`site:${site.id}`);
    expect(ids).toContain("page:page-geocities-1998-modem");
    expect(ids).not.toContain("page:page-altavista-1998-search");
    expect(ids).not.toContain("page:page-altavista-1998-home");
  });

  it("every document has a URL the browser can resolve", () => {
    for (const doc of derived) expect(doc.url).toMatch(/^http:\/\/[a-z0-9.-]+\//);
  });

  it("the shared index finds 1998 sites in 1998 but not Napster", () => {
    const annuaire = search(timeSearchIndex, { query: "annuaire", selectedDate: "1998-06-15" });
    expect(annuaire.hits[0]?.document.id).toBe("site:yahoo-com");
    expect(search(timeSearchIndex, { query: "napster", selectedDate: "1998-06-15" }).hits).toEqual(
      [],
    );
    expect(
      search(timeSearchIndex, { query: "vidéos", selectedDate: "2005-12-01" }).hits.map(
        (h) => h.document.id,
      ),
    ).toContain("site:youtube-com");
  });
});

describe("providers", () => {
  it("resolves era providers and falls back for unknown ids", () => {
    expect(getSearchProvider("time-search-2005").label).toBe("Time Search 2005");
    expect(getSearchProvider("nope").id).toBe("nope");
    expect(getSearchProvider(undefined).resultsPerPage).toBe(10);
  });
});
