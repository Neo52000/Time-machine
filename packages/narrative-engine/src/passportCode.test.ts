import { describe, expect, it } from "vitest";
import { decodePassport, encodePassport, narrativeCatalog } from "./index";

const stamp = (id: string, eraId = "1998") => ({ id, eraId, title: id, hint: "h", icon: "*" });
const stamps = [stamp("a-1"), stamp("b-2"), stamp("c-3", "2005")];

describe("passport code", () => {
  it("encodes earned stamps in catalogue order, whatever the award order", () => {
    expect(encodePassport(stamps, { "c-3": 1, "a-1": 2, ghost: 3 })).toBe("a-1.c-3");
    expect(encodePassport(stamps, {})).toBe("");
  });

  it("round-trips and drops what it does not know", () => {
    const code = encodePassport(stamps, { "a-1": 1, "b-2": 1 });
    expect(decodePassport(stamps, code)?.map((s) => s.id)).toEqual(["a-1", "b-2"]);
    expect(decodePassport(stamps, "c-3.renamed.a-1")?.map((s) => s.id)).toEqual(["a-1", "c-3"]);
    expect(decodePassport(stamps, "a-1%2Eb-2")?.map((s) => s.id)).toEqual(["a-1", "b-2"]);
  });

  it("refuses codes that name no stamp", () => {
    expect(decodePassport(stamps, "")).toBeNull();
    expect(decodePassport(stamps, "nothing.here")).toBeNull();
    expect(decodePassport(stamps, "%E0%A4%A")).toBeNull();
  });

  it("keeps a full real passport URL-safe and short enough to share", () => {
    const all = Object.fromEntries(narrativeCatalog.stamps.map((s) => [s.id, 1]));
    const code = encodePassport(narrativeCatalog.stamps, all);
    expect(code).toMatch(/^[a-z0-9.-]+$/);
    expect(code.length).toBeLessThan(400);
    expect(decodePassport(narrativeCatalog.stamps, code)).toHaveLength(
      narrativeCatalog.stamps.length,
    );
  });
});
