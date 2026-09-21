import { describe, expect, it } from "vitest";
import { baseCurrency, isSupportedCurrency } from "@/config/currency";
import { parseCurrencyPreference } from "@/lib/currency/preference";

describe("parseCurrencyPreference", () => {
  it("accepts supported currencies", () => {
    expect(parseCurrencyPreference("MXN")).toBe("MXN");
    expect(parseCurrencyPreference("USD")).toBe("USD");
    expect(parseCurrencyPreference("eur")).toBe("EUR");
  });

  it("falls back to MXN for invalid values", () => {
    expect(parseCurrencyPreference("ABC")).toBe(baseCurrency);
    expect(parseCurrencyPreference("BTC")).toBe("MXN");
    expect(parseCurrencyPreference("TEST")).toBe("MXN");
    expect(parseCurrencyPreference("")).toBe("MXN");
    expect(parseCurrencyPreference(undefined)).toBe("MXN");
    expect(parseCurrencyPreference(null)).toBe("MXN");
  });
});

describe("isSupportedCurrency", () => {
  it("rejects unknown codes", () => {
    expect(isSupportedCurrency("MXN")).toBe(true);
    expect(isSupportedCurrency("BTC")).toBe(false);
    expect(isSupportedCurrency("ABC")).toBe(false);
  });
});
