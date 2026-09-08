import type { TimeWebCatalog } from "@time-machine/browser-engine";
import type { PageBlock, ReconstructedPage, SearchDocument } from "@time-machine/content-schema";

/**
 * Derive search documents from the Time Web catalogue so the index and the
 * browser can never disagree about what exists: every website becomes a
 * document (enriched with the text of its reconstructed home page), and
 * every reconstructed sub-page becomes a document of its own. Result pages
 * (those carrying a `search-results` block) are never indexed.
 */
function textOfBlocks(blocks: PageBlock[]): string[] {
  const out: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
      case "paragraph":
        out.push(block.text);
        break;
      case "links":
        if (block.title) out.push(block.title);
        for (const link of block.items) {
          out.push(link.label);
          if (link.description) out.push(link.description);
        }
        break;
      case "list":
        out.push(...block.items);
        break;
      default:
        break;
    }
  }
  return out;
}

function isResultsPage(page: ReconstructedPage): boolean {
  return page.blocks.some((b) => b.type === "search-results");
}

function siteUrl(domain: string, path = "/"): string {
  return `http://${domain}${path}`;
}

export function documentsFromCatalog(catalog: TimeWebCatalog): SearchDocument[] {
  const docs: SearchDocument[] = [];

  for (const site of catalog.websites) {
    const pages = catalog.pagesOf(site.id);
    // Every version's home page feeds the site document, so a search finds
    // the site whichever version is current.
    const homeText = pages.filter((p) => p.path === "/").flatMap((p) => textOfBlocks(p.blocks));

    docs.push({
      id: `site:${site.id}`,
      title: site.title,
      description: site.description,
      url: siteUrl(site.domain),
      keywords: [...site.category, site.domain, ...homeText],
      availableFrom: site.availableFrom,
      availableUntil: site.availableUntil,
    });

    for (const page of pages) {
      if (page.path === "/" || isResultsPage(page)) continue;
      const text = textOfBlocks(page.blocks);
      const version = catalog.getSnapshot(page.snapshotId);
      // A sub-page exists from its version's capture date, never before the site itself.
      const availableFrom =
        version && version.capturedAt > site.availableFrom
          ? version.capturedAt
          : site.availableFrom;
      docs.push({
        id: `page:${page.id}`,
        title: page.title,
        description: text.find((t) => t.length > 40) ?? text[0],
        url: siteUrl(site.domain, page.path),
        keywords: [...site.category, site.domain, ...text],
        availableFrom,
        availableUntil: site.availableUntil,
        contentRef: page.id,
      });
    }
  }

  return docs;
}
