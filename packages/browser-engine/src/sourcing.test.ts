import { describe, expect, it } from "vitest";
import { isAuthoritativeSource } from "@time-machine/content-schema";
import { timeWebCatalog } from "./content";

/**
 * Sourcing quality of the live Time Web content (docs/historical-sources.md).
 * Every dated fact should rest on a primary, institutional or press source;
 * encyclopedias are context only. The ratchet below may only go down: when
 * a batch of sources lands, lower it to the new count in the same commit.
 */
const MAX_WITHOUT_AUTHORITATIVE_SOURCE = 2;

const { events, websites, sources } = timeWebCatalog;
const sourceById = new Map(sources.map((s) => [s.id, s]));
const hasAuthoritativeSource = (sourceIds: string[]) =>
  sourceIds.some((id) => {
    const source = sourceById.get(id);
    return source !== undefined && isAuthoritativeSource(source);
  });

describe("sourcing", () => {
  it("files encyclopedias as references, never as authoritative sources", () => {
    const encyclopedia =
      /(^|\.)(wikipedia\.org|wikimedia\.org|britannica\.com|encyclopedia\.com|ebsco\.com)$/;
    for (const s of sources) {
      if (s.url && encyclopedia.test(new URL(s.url).hostname)) {
        expect(s.kind, s.id).toBe("reference");
      }
    }
  });

  it("only ever reduces the facts that lack an authoritative source", () => {
    const missing = [
      ...events.filter((e) => !hasAuthoritativeSource(e.sourceIds)).map((e) => e.id),
      ...websites.filter((w) => !hasAuthoritativeSource(w.sourceIds)).map((w) => w.id),
    ];
    expect(missing.length, missing.join(", ")).toBeLessThanOrEqual(
      MAX_WITHOUT_AUTHORITATIVE_SOURCE,
    );
  });
});
