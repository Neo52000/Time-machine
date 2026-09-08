import { describe, expect, it } from "vitest";
import { createTimeWebCatalog } from "./catalog";
import { timeWebCatalog } from "./content";
import {
  canGoBack,
  canGoForward,
  createBrowserHistory,
  currentUrl,
  goBack,
  goForward,
  navigateTo,
} from "./history";
import { isAllowedArchiveUrl, resolveHistoricalUrl } from "./resolve";
import { hostMatchesDomain, normalizeUrl, resolveLink } from "./url";

describe("normalizeUrl", () => {
  it("adds http:// and lowercases the host", () => {
    const parsed = normalizeUrl("WWW.AltaVista.com");
    expect(parsed).toMatchObject({
      scheme: "http",
      hostname: "www.altavista.com",
      domain: "altavista.com",
      pathname: "/",
    });
    expect(parsed?.href).toBe("http://www.altavista.com/");
  });

  it("keeps paths and parses the query string", () => {
    const parsed = normalizeUrl("altavista.com/cgi-bin/query?q=minitel+1985");
    expect(parsed?.pathname).toBe("/cgi-bin/query");
    expect(parsed?.query).toEqual({ q: "minitel 1985" });
  });

  it("handles about: pages", () => {
    expect(normalizeUrl("about:home")).toMatchObject({ scheme: "about", pathname: "home" });
    expect(normalizeUrl("ABOUT:")?.href).toBe("about:blank");
  });

  it("rejects garbage and non-web schemes", () => {
    expect(normalizeUrl("")).toBeUndefined();
    expect(normalizeUrl("   ")).toBeUndefined();
    expect(normalizeUrl("localhost")).toBeUndefined();
    expect(normalizeUrl("ftp://ftp.cern.ch/")).toBeUndefined();
    expect(normalizeUrl("javascript:alert(1)")).toBeUndefined();
  });

  it("resolves relative links against the current page", () => {
    const base = normalizeUrl("http://www.altavista.com/cgi-bin/query?q=x")!;
    expect(resolveLink("/", base)).toBe("http://www.altavista.com/");
    expect(resolveLink("http://www.yahoo.com/", base)).toBe("http://www.yahoo.com/");
    expect(resolveLink("about:home", base)).toBe("about:home");
  });

  it("matches subdomains but not look-alikes", () => {
    expect(hostMatchesDomain("www.yahoo.com", "yahoo.com")).toBe(true);
    expect(hostMatchesDomain("mail.yahoo.com", "yahoo.com")).toBe(true);
    expect(hostMatchesDomain("notyahoo.com", "yahoo.com")).toBe(false);
  });
});

describe("seed catalogue", () => {
  it("loads, validates and is referentially consistent", () => {
    expect(timeWebCatalog.websites.length).toBeGreaterThanOrEqual(8);
    expect(timeWebCatalog.pages.length).toBeGreaterThanOrEqual(7);
    for (const page of timeWebCatalog.pages) {
      for (const block of page.blocks) {
        if (block.type !== "links") continue;
        for (const link of block.items) {
          const target = link.href.startsWith("/")
            ? timeWebCatalog.getWebsite(page.websiteId)
            : timeWebCatalog.findWebsiteByHost(normalizeUrl(link.href)!.hostname);
          expect(target, `${page.id} links to unknown ${link.href}`).toBeDefined();
        }
      }
    }
  });

  it("nothing published with unknown rights", () => {
    for (const snap of timeWebCatalog.snapshots) {
      expect(snap.rightsStatus).not.toBe("unknown");
    }
  });

  it("rejects dangling references", () => {
    expect(() =>
      createTimeWebCatalog({
        websites: [
          {
            id: "w",
            domain: "w.com",
            title: "W",
            category: [],
            availableFrom: "1998-01-01",
            sourceIds: ["missing-source"],
          },
        ],
        snapshots: [],
        pages: [],
        events: [],
        sources: [],
      }),
    ).toThrow(/unknown source "missing-source"/);
  });
});

describe("resolveHistoricalUrl (six-step flow)", () => {
  const at1998 = (url: string) =>
    resolveHistoricalUrl(timeWebCatalog, { url, selectedDate: "1998-06-15" });

  it("1. reconstruction when a local page exists at the date", () => {
    const res = at1998("altavista.com");
    expect(res).toMatchObject({
      type: "reconstruction",
      websiteId: "altavista-com",
      pageId: "page-altavista-1998-home",
    });
  });

  it("routes sub-paths to their reconstruction page and keeps the query", () => {
    const res = at1998("http://www.altavista.com/cgi-bin/query?q=modem");
    expect(res).toMatchObject({ type: "reconstruction", pageId: "page-altavista-1998-search" });
    expect(res.url?.query).toEqual({ q: "modem" });
  });

  it("unknown page on a reconstructed site is a page-unknown 404", () => {
    expect(at1998("altavista.com/nope")).toMatchObject({
      type: "not-found",
      reason: "page-unknown",
    });
  });

  it("prefers the reconstruction over an archive of the same site", () => {
    expect(at1998("yahoo.com")).toMatchObject({ type: "reconstruction", websiteId: "yahoo-com" });
  });

  it("3. falls back to the allow-listed archive when no reconstruction is eligible yet", () => {
    // Yahoo's reconstruction is captured 1998-01-01; in 1997 only the archive snapshot is dated ≤ date.
    const catalog = createTimeWebCatalog({
      websites: timeWebCatalog.websites,
      snapshots: timeWebCatalog.snapshots.map((s) =>
        s.id === "snap-yahoo-1998-archive" ? { ...s, capturedAt: "1996-10-17" } : s,
      ),
      pages: timeWebCatalog.pages,
      events: timeWebCatalog.events,
      sources: timeWebCatalog.sources,
    });
    const res = resolveHistoricalUrl(catalog, { url: "yahoo.com", selectedDate: "1997-03-01" });
    expect(res).toMatchObject({ type: "archive", snapshotId: "snap-yahoo-1998-archive" });
    expect(res.type === "archive" && isAllowedArchiveUrl(res.archiveUrl)).toBe(true);
  });

  it("ignores archives outside the allow-list and snapshots with unknown rights", () => {
    const catalog = createTimeWebCatalog({
      websites: timeWebCatalog.websites,
      snapshots: [
        {
          id: "bad-archive",
          websiteId: "lycos-com",
          capturedAt: "1997-01-01",
          type: "archive",
          contentRef: "https://evil.example/lycos",
          sourceIds: [],
          rightsStatus: "reference-only",
        },
        {
          id: "unknown-rights",
          websiteId: "lycos-com",
          capturedAt: "1997-01-01",
          type: "reconstruction",
          contentRef: "page-altavista-1998-home",
          sourceIds: [],
          rightsStatus: "unknown",
        },
      ],
      pages: timeWebCatalog.pages,
      events: timeWebCatalog.events,
      sources: timeWebCatalog.sources,
    });
    const res = resolveHistoricalUrl(catalog, { url: "lycos.com", selectedDate: "1998-06-15" });
    expect(res).toMatchObject({ type: "document", eventId: "lycos-launch" });
  });

  it("4. document: a site with no snapshot but a related event", () => {
    expect(at1998("lycos.com")).toMatchObject({
      type: "document",
      websiteId: "lycos-com",
      eventId: "lycos-launch",
    });
  });

  it("5. documentary card: a known site with nothing else", () => {
    expect(at1998("www.amazon.com")).toMatchObject({
      type: "website-card",
      websiteId: "amazon-com",
    });
  });

  it("6. temporal 404: not yet online, with the event that explains it", () => {
    expect(at1998("napster.com")).toMatchObject({
      type: "not-found",
      reason: "not-yet-online",
      websiteId: "napster-com",
      eventIds: ["napster-launch"],
    });
  });

  it("6. temporal 404: no longer online", () => {
    const res = resolveHistoricalUrl(timeWebCatalog, {
      url: "geocities.com",
      selectedDate: "2012-01-01",
    });
    expect(res).toMatchObject({
      type: "not-found",
      reason: "no-longer-online",
      websiteId: "geocities-com",
    });
  });

  it("6. temporal 404: unknown domain and invalid input", () => {
    expect(at1998("does-not-exist.example")).toMatchObject({
      type: "not-found",
      reason: "domain-unknown",
    });
    expect(at1998("???")).toMatchObject({ type: "not-found", reason: "invalid-url" });
    expect(at1998("about:home")).toMatchObject({ type: "not-found", reason: "invalid-url" });
  });

  it("a reconstruction captured after the date is not shown", () => {
    // Google's 1998 reconstruction is captured 1998-09-04; in March 1998 the domain is live but the page isn't.
    const res = resolveHistoricalUrl(timeWebCatalog, {
      url: "google.com",
      selectedDate: "1998-03-01",
    });
    expect(res).toMatchObject({ type: "document", eventId: "google-founded" });
  });
});

describe("browser history", () => {
  it("navigates, goes back and forward, and truncates forward entries", () => {
    let h = createBrowserHistory("about:home");
    h = navigateTo(h, "http://www.altavista.com/");
    h = navigateTo(h, "http://www.yahoo.com/");
    expect(currentUrl(h)).toBe("http://www.yahoo.com/");
    expect(canGoBack(h)).toBe(true);
    expect(canGoForward(h)).toBe(false);

    h = goBack(h);
    expect(currentUrl(h)).toBe("http://www.altavista.com/");
    expect(canGoForward(h)).toBe(true);

    h = goForward(h);
    expect(currentUrl(h)).toBe("http://www.yahoo.com/");

    h = goBack(h);
    h = navigateTo(h, "http://www.google.com/");
    expect(h.entries).toEqual([
      "about:home",
      "http://www.altavista.com/",
      "http://www.google.com/",
    ]);
    expect(canGoForward(h)).toBe(false);
  });

  it("re-navigating to the current url and going past the ends are no-ops", () => {
    const h = createBrowserHistory("about:home");
    expect(navigateTo(h, "about:home")).toBe(h);
    expect(goBack(h)).toBe(h);
    expect(goForward(h)).toBe(h);
  });
});
