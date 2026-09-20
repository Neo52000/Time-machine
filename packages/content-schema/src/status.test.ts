import { describe, expect, it } from "vitest";
import { blockingReason, contentStatus } from "./status";

describe("contentStatus", () => {
  it("is needs-research when needsResearch is set, regardless of other flags", () => {
    expect(contentStatus({ needsResearch: true, published: true })).toBe("needs-research");
    expect(contentStatus({ needsResearch: true, rightsStatus: "unknown" })).toBe("needs-research");
  });

  it("is needs-rights-review when rightsStatus is unknown", () => {
    expect(contentStatus({ rightsStatus: "unknown" })).toBe("needs-rights-review");
  });

  it("is published when published is true and nothing blocks it", () => {
    expect(contentStatus({ published: true, rightsStatus: "original" })).toBe("published");
  });

  it("is ready when nothing blocks it but it is not published yet", () => {
    expect(contentStatus({ published: false, rightsStatus: "original" })).toBe("ready");
    expect(contentStatus({})).toBe("ready");
  });
});

describe("blockingReason", () => {
  it("returns null when nothing blocks publishing", () => {
    expect(blockingReason({ rightsStatus: "public-domain" })).toBeNull();
  });

  it("reports needsResearch before rightsStatus", () => {
    expect(blockingReason({ needsResearch: true, rightsStatus: "unknown" })).toMatch(/research/);
  });

  it("reports unknown rights", () => {
    expect(blockingReason({ rightsStatus: "unknown" })).toMatch(/unknown/);
  });
});
