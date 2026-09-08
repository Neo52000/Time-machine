/**
 * URL handling for the internal browser. Accepts what a 1998 user would
 * type ("altavista.com", "www.yahoo.com/", "http://google.com") and
 * produces a canonical historical URL. `about:` pages are internal.
 */
export interface ParsedUrl {
  href: string;
  scheme: "http" | "https" | "about";
  hostname: string;
  /** Hostname without a leading "www." */
  domain: string;
  pathname: string;
  query: Record<string, string>;
}

export function isAboutUrl(input: string): boolean {
  return input.trim().toLowerCase().startsWith("about:");
}

export function normalizeUrl(input: string): ParsedUrl | undefined {
  const raw = input.trim();
  if (!raw) return undefined;

  if (isAboutUrl(raw)) {
    const page = raw.slice("about:".length).toLowerCase() || "blank";
    return {
      href: `about:${page}`,
      scheme: "about",
      hostname: "",
      domain: "",
      pathname: page,
      query: {},
    };
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return undefined;
  }
  const scheme = url.protocol.replace(":", "").toLowerCase();
  if (scheme !== "http" && scheme !== "https") return undefined;
  if (!url.hostname || !url.hostname.includes(".")) return undefined;

  const hostname = url.hostname.toLowerCase();
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    href: url.href,
    scheme,
    hostname,
    domain: hostname.replace(/^www\./, ""),
    pathname: url.pathname || "/",
    query,
  };
}

/** Resolve a link target found in a reconstructed page against the page's URL. */
export function resolveLink(href: string, base: ParsedUrl): string {
  if (isAboutUrl(href) || /^[a-z][a-z0-9+.-]*:\/\//i.test(href)) return href;
  if (base.scheme === "about") return href;
  try {
    return new URL(href, base.href).href;
  } catch {
    return href;
  }
}

/** Does `hostname` belong to `domain` (exact or subdomain)? */
export function hostMatchesDomain(hostname: string, domain: string): boolean {
  const host = hostname.replace(/^www\./, "");
  return host === domain || host.endsWith(`.${domain}`);
}
