import { describe, expect, it } from "vitest";
import { formatMoney } from "@/lib/money";

describe("formatMoney", () => {
  it("formats MXN minor units with es-MX via Intl.NumberFormat", () => {
    const expected = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(450);

    expect(
      formatMoney({ amountMinor: 45000, currency: "MXN" }, "es-MX"),
    ).toBe(expected);
  });

  it("formats USD minor units with en-US via Intl.NumberFormat", () => {
    const expected = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(2430 / 100);

    expect(
      formatMoney({ amountMinor: 2430, currency: "USD" }, "en-US"),
    ).toBe(expected);
  });

  it("rejects non-integer minor units", () => {
    expect(() =>
      formatMoney({ amountMinor: 450.5, currency: "MXN" }, "es-MX"),
    ).toThrow(/integer/i);
  });
});
