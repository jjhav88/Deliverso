import { afterEach, describe, expect, it, vi } from "vitest";
import { convertMinorUnits } from "@/lib/money/convert";
import { toDisplayMoney } from "@/lib/money/to-display";
import {
  parseLocaleSwitchInput,
  parsePublicPathname,
  pickTranslatedSlug,
} from "@/modules/i18n/locale-switch";
import { extractRateString, FrankfurterExchangeRateProvider } from "@/server/exchange-rates/frankfurter";
import {
  classifyFxSnapshotSet,
  FX_FRESH_TTL_MS,
  FX_STALE_TTL_MS,
} from "@/server/exchange-rates/policy";
import { getQuoteFromSet, createIdentityRateSet } from "@/server/exchange-rates/rate-set";

describe("locale switch validation", () => {
  it("maps ES product slug input without accepting external URLs", () => {
    expect(
      parseLocaleSwitchInput({
        to: "en-US",
        pathname: "/productos/[slug]",
        slug: "cheesecake-de-durazno",
      }),
    ).toEqual({
      to: "en-US",
      pathname: "/productos/[slug]",
      slug: "cheesecake-de-durazno",
    });

    expect(
      parseLocaleSwitchInput({
        to: "en-US",
        pathname: "https://otro-sitio.com",
      }),
    ).toBeNull();
    expect(
      parseLocaleSwitchInput({
        to: "en-US",
        pathname: "/productos/[slug]",
        slug: "https://evil.test",
      }),
    ).toBeNull();
  });

  it("parses localized public paths into internal pathnames", () => {
    expect(parsePublicPathname("/productos/cheesecake-de-durazno")).toEqual({
      kind: "product",
      pathname: "/productos/[slug]",
      slug: "cheesecake-de-durazno",
    });
    expect(parsePublicPathname("/en/products/peach-cheesecake")).toEqual({
      kind: "product",
      pathname: "/productos/[slug]",
      slug: "peach-cheesecake",
    });
    expect(parsePublicPathname("/en/universes/celebration")).toEqual({
      kind: "universe",
      pathname: "/universos/[slug]",
      slug: "celebration",
    });
  });

  it("resolves translated slugs from DB rows, never by rewriting the visible slug", () => {
    const translations = [
      { locale: "es-MX", slug: "cheesecake-de-durazno" },
      { locale: "en-US", slug: "peach-cheesecake" },
    ];
    expect(pickTranslatedSlug(translations, "en-US")).toBe("peach-cheesecake");
    expect(pickTranslatedSlug(translations, "es-MX")).toBe("cheesecake-de-durazno");
    expect(
      pickTranslatedSlug([{ locale: "es-MX", slug: "cheesecake-de-durazno" }], "en-US"),
    ).toBeNull();
  });
});

describe("FX conversion math", () => {
  it("converts 49900 MXN with a deterministic rate using half-up rounding", () => {
    const amountMinor = convertMinorUnits({
      amountMinor: 49900,
      from: "MXN",
      to: "USD",
      rate: "0.057",
    });
    expect(amountMinor).toBe(2844);
    const display = toDisplayMoney({
      amount: { amountMinor: 49900, currency: "MXN" },
      locale: "es-MX",
      displayCurrency: "USD",
      rate: {
        quoteCurrency: "USD",
        rate: "0.057",
        sourceDate: "2026-09-15",
        fetchedAt: new Date("2026-09-16T12:00:00Z"),
        provider: "FRANKFURTER_ECB",
        source: "ECB",
        stale: false,
      },
    });
    expect(display.amountMinor).toBe(2844);
    expect(display.currency).toBe("USD");
    expect(display.originalCurrency).toBe("MXN");
    expect(display.formatted).toBe(
      new Intl.NumberFormat("es-MX", { style: "currency", currency: "USD" }).format(28.44),
    );
    expect(display.unavailable).toBe(false);
  });

  it("keeps MXN identity without a provider rate", () => {
    expect(
      convertMinorUnits({
        amountMinor: 49900,
        from: "MXN",
        to: "MXN",
        rate: "1",
      }),
    ).toBe(49900);
    expect(getQuoteFromSet(createIdentityRateSet(), "MXN")?.rate).toBe("1");
  });

  it("falls back to MXN when the quote rate is missing", () => {
    const display = toDisplayMoney({
      amount: { amountMinor: 49900, currency: "MXN" },
      locale: "es-MX",
      displayCurrency: "USD",
      rate: null,
    });
    expect(display.currency).toBe("MXN");
    expect(display.unavailable).toBe(true);
    expect(display.amountMinor).toBe(49900);
  });

  it("never treats an absent quote as 1:1", () => {
    expect(getQuoteFromSet(createIdentityRateSet(), "USD")).toBeNull();
  });

  it("extracts rate strings from raw Frankfurter JSON", () => {
    const raw =
      '[{"date":"2026-09-15","base":"MXN","quote":"USD","rate":0.05712},{"date":"2026-09-15","base":"MXN","quote":"EUR","rate":0.0489}]';
    expect(extractRateString(raw, "USD")).toBe("0.05712");
    expect(extractRateString(raw, "CAD")).toBeNull();
  });
});

describe("FX cache windows", () => {
  const now = new Date("2026-09-16T12:00:00Z");

  it("keeps a 12h fresh window and 96h stale fallback", () => {
    expect(FX_FRESH_TTL_MS).toBe(12 * 60 * 60 * 1000);
    expect(FX_STALE_TTL_MS).toBe(96 * 60 * 60 * 1000);
  });

  it("classifies fresh, stale and expired snapshot sets", () => {
    const four = (fetchedAt: Date) => [fetchedAt, fetchedAt, fetchedAt, fetchedAt];
    expect(
      classifyFxSnapshotSet(four(new Date(now.getTime() - 2 * 60 * 60 * 1000)), now, 4),
    ).toBe("fresh");
    expect(
      classifyFxSnapshotSet(four(new Date(now.getTime() - 24 * 60 * 60 * 1000)), now, 4),
    ).toBe("stale");
    expect(
      classifyFxSnapshotSet(four(new Date(now.getTime() - 100 * 60 * 60 * 1000)), now, 4),
    ).toBe("expired");
    expect(classifyFxSnapshotSet(four(now).slice(0, 1), now, 4)).toBe("incomplete");
  });
});

describe("FrankfurterExchangeRateProvider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses a valid batch quote without calling the network when fetch is faked", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify([
            { date: "2026-09-15", base: "MXN", quote: "USD", rate: 0.05712 },
            { date: "2026-09-15", base: "MXN", quote: "EUR", rate: 0.0489 },
            { date: "2026-09-15", base: "MXN", quote: "CAD", rate: 0.0781 },
            { date: "2026-09-15", base: "MXN", quote: "GBP", rate: 0.0422 },
          ]),
      }),
    );

    const quotes = await new FrankfurterExchangeRateProvider("https://fx.test").getQuotes({
      baseCurrency: "MXN",
      quoteCurrencies: ["USD", "EUR", "CAD", "GBP"],
    });

    expect(quotes).toHaveLength(4);
    expect(quotes[0]?.rate).toBe("0.05712");
    expect(quotes[0]?.provider).toBe("FRANKFURTER_ECB");
    expect(quotes[0]?.source).toBe("ECB");
    expect(quotes[0]?.sourceDate).toBe("2026-09-15");
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(calledUrl).toContain("/v2/rates");
    expect(calledUrl).toContain("base=MXN");
    expect(calledUrl).toContain("providers=ecb");
  });

  it("rejects an invalid or non-positive rate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify([
            { date: "2026-09-15", base: "MXN", quote: "USD", rate: 0 },
            { date: "2026-09-15", base: "MXN", quote: "EUR", rate: 0.04 },
            { date: "2026-09-15", base: "MXN", quote: "CAD", rate: 0.07 },
            { date: "2026-09-15", base: "MXN", quote: "GBP", rate: 0.04 },
          ]),
      }),
    );

    await expect(
      new FrankfurterExchangeRateProvider("https://fx.test").getQuotes({
        baseCurrency: "MXN",
        quoteCurrencies: ["USD", "EUR", "CAD", "GBP"],
      }),
    ).rejects.toThrow(/validation|omitted/i);
  });

  it("retries once and then surfaces a provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("timeout")),
    );

    await expect(
      new FrankfurterExchangeRateProvider("https://fx.test").getQuotes({
        baseCurrency: "MXN",
        quoteCurrencies: ["USD"],
      }),
    ).rejects.toThrow("timeout");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });
});
