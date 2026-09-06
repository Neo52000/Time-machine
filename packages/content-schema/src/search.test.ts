import { describe, expect, it } from "vitest";
import { isAvailableAt } from "./search";

describe("isAvailableAt", () => {
  it("is false before availableFrom", () => {
    expect(isAvailableAt({ availableFrom: "1998-01-01" }, "1997-12-31")).toBe(false);
  });

  it("is true on and after availableFrom with no availableUntil", () => {
    expect(isAvailableAt({ availableFrom: "1998-01-01" }, "1998-01-01")).toBe(true);
    expect(isAvailableAt({ availableFrom: "1998-01-01" }, "2020-01-01")).toBe(true);
  });

  it("is false after availableUntil", () => {
    expect(
      isAvailableAt({ availableFrom: "1998-01-01", availableUntil: "1999-12-31" }, "2000-01-01"),
    ).toBe(false);
  });

  it("is true within the availability window", () => {
    expect(
      isAvailableAt({ availableFrom: "1998-01-01", availableUntil: "1999-12-31" }, "1998-06-01"),
    ).toBe(true);
  });
});
