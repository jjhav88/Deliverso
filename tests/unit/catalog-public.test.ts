import { describe, expect, it } from "vitest";
import { catalogPriceFromVariant } from "@/modules/catalog/public/price";
import { isPublicProductStatus, shouldOmitFromLocaleCatalog } from "@/modules/catalog/public/visibility";
import { minutesToHumanLeadTime, formatHumanLeadTime } from "@/modules/catalog/public/lead-time";
import { parseCatalogListQuery, CATALOG_PAGE_SIZE } from "@/modules/catalog/public/list-query";
import { paginateIds, hasCatalogFilters, catalogQueryToSearchParams } from "@/modules/catalog/public/url-state";
import { pickRelatedProductIds } from "@/modules/catalog/public/related";
import { resolveProductSeo, localesWithTranslation } from "@/modules/catalog/public/seo";
import { buildProductJsonLd, shouldExposeProductOffer } from "@/modules/catalog/public/json-ld";
import { sortCatalogRows } from "@/modules/catalog/public/sort";
import { appPathnames } from "@/config/navigation";

describe("public catalog visibility", () => {
  it("only treats PUBLISHED as public", () => {
    expect(isPublicProductStatus("PUBLISHED")).toBe(true);
    expect(isPublicProductStatus("DRAFT")).toBe(false);
    expect(isPublicProductStatus("ARCHIVED")).toBe(false);
  });

  it("omits a product from a locale catalog without that translation", () => {
    expect(shouldOmitFromLocaleCatalog("es-MX", false)).toBe(true);
    expect(shouldOmitFromLocaleCatalog("es-MX", true)).toBe(false);
    expect(shouldOmitFromLocaleCatalog("en-US", false)).toBe(true);
    expect(shouldOmitFromLocaleCatalog("en-US", true)).toBe(false);
  });
});

describe("localized catalog pathnames", () => {
  it("maps product and universe detail routes", () => {
    expect(appPathnames["/productos/[slug]"]).toEqual({
      "es-MX": "/productos/[slug]",
      "en-US": "/products/[slug]",
    });
    expect(appPathnames["/universos/[slug]"]).toEqual({
      "es-MX": "/universos/[slug]",
      "en-US": "/universes/[slug]",
    });
  });
});

describe("catalog pricing", () => {
  it("uses the default variant amount for STANDARD", () => {
    expect(catalogPriceFromVariant({ type: "STANDARD", priceMinor: 45000 })).toEqual({
      price: { amountMinor: 45000, currency: "MXN" },
      priceKind: "exact",
    });
  });

  it("marks CONFIGURABLE as a starting price", () => {
    expect(catalogPriceFromVariant({ type: "CONFIGURABLE", priceMinor: 80000 })).toEqual({
      price: { amountMinor: 80000, currency: "MXN" },
      priceKind: "from",
    });
  });

  it("never exposes a CUSTOM_QUOTE amount", () => {
    expect(catalogPriceFromVariant({ type: "CUSTOM_QUOTE", priceMinor: 0 })).toEqual({
      price: null,
      priceKind: "quote",
    });
    expect(catalogPriceFromVariant({ type: "CUSTOM_QUOTE", priceMinor: null })).toEqual({
      price: null,
      priceKind: "quote",
    });
  });

  it("treats a missing default variant as unpriced", () => {
    expect(catalogPriceFromVariant({ type: "STANDARD", priceMinor: null })).toEqual({
      price: null,
      priceKind: "quote",
    });
  });
});

describe("catalog sort", () => {
  const rows = [
    {
      id: "quote",
      name: "Alpha quote",
      type: "CUSTOM_QUOTE" as const,
      priceMinor: null,
      publishedAt: new Date("2026-01-02"),
    },
    {
      id: "cheap",
      name: "Bravo cake",
      type: "STANDARD" as const,
      priceMinor: 20000,
      publishedAt: new Date("2026-01-01"),
    },
    {
      id: "pricey",
      name: "Charlie cake",
      type: "STANDARD" as const,
      priceMinor: 90000,
      publishedAt: new Date("2026-01-03"),
    },
  ];

  it("places CUSTOM_QUOTE after priced products", () => {
    expect(sortCatalogRows(rows, "price-asc", "es-MX").map((row) => row.id)).toEqual([
      "cheap",
      "pricey",
      "quote",
    ]);
    expect(sortCatalogRows(rows, "price-desc", "es-MX").map((row) => row.id)).toEqual([
      "pricey",
      "cheap",
      "quote",
    ]);
  });

  it("uses publishedAt for recommended", () => {
    expect(sortCatalogRows(rows, "recommended", "es-MX").map((row) => row.id)).toEqual([
      "pricey",
      "quote",
      "cheap",
    ]);
  });
});

describe("catalog pagination and URL state", () => {
  it("pages 12 items and keeps query params shareable", () => {
    const ids = Array.from({ length: 25 }, (_, index) => `p${index + 1}`);
    const page2 = paginateIds(ids, 2);
    expect(CATALOG_PAGE_SIZE).toBe(12);
    expect(page2.total).toBe(25);
    expect(page2.pageIds).toHaveLength(12);
    expect(page2.pageIds[0]).toBe("p13");

    const params = catalogQueryToSearchParams({
      q: "chocolate",
      categorySlug: "cheesecakes",
      universeSlug: "celebracion",
      type: "",
      sort: "recommended",
      page: 2,
    });
    expect(params.get("q")).toBe("chocolate");
    expect(params.get("categoria")).toBe("cheesecakes");
    expect(params.get("universo")).toBe("celebracion");
    expect(params.get("page")).toBe("2");
    expect(hasCatalogFilters({ q: "chocolate", categorySlug: "", universeSlug: "", type: "" })).toBe(
      true,
    );
  });

  it("parses list query params", () => {
    const query = parseCatalogListQuery("en-US", {
      q: "peach",
      universo: "celebration",
      tipo: "STANDARD",
      orden: "name",
      page: "3",
    });
    expect(query).toMatchObject({
      locale: "en-US",
      q: "peach",
      universeSlug: "celebration",
      type: "STANDARD",
      sort: "name",
      page: 3,
    });
  });
});

describe("related products", () => {
  it("prefers the same universe and never returns the current product", () => {
    expect(
      pickRelatedProductIds({
        currentId: "current",
        universeMatches: ["current", "u1", "u2"],
        categoryMatches: ["c1", "u1"],
      }),
    ).toEqual(["u1", "u2", "c1"]);
  });
});

describe("lead time copy", () => {
  it("converts minutes into human units", () => {
    expect(minutesToHumanLeadTime(1440)).toEqual({ value: 1, unit: "days" });
    expect(minutesToHumanLeadTime(2880)).toEqual({ value: 2, unit: "days" });
    expect(formatHumanLeadTime(1440, "es-MX")).toBe("Preparación mínima: 1 día");
    expect(formatHumanLeadTime(2880, "es-MX")).toBe("Preparación mínima: 2 días");
    expect(formatHumanLeadTime(1440, "en-US")).toBe("Minimum preparation: 1 day");
  });
});

describe("product metadata helpers", () => {
  it("falls back from SEO fields to name and short description", () => {
    expect(
      resolveProductSeo({
        name: "Cheesecake de durazno",
        shortDescription: "Crema y fruta.",
        seoTitle: null,
        seoDescription: null,
      }),
    ).toEqual({
      title: "Cheesecake de durazno",
      description: "Crema y fruta.",
    });
  });

  it("lists only locales that have a translation", () => {
    expect(localesWithTranslation([{ locale: "es-MX" }])).toEqual(["es-MX"]);
    expect(
      localesWithTranslation([{ locale: "es-MX" }, { locale: "en-US" }]),
    ).toEqual(["es-MX", "en-US"]);
  });

  it("adds offers only for STANDARD products with a real price", () => {
    const price = { amountMinor: 45000, currency: "MXN" as const };
    expect(shouldExposeProductOffer("STANDARD", price)).toBe(true);
    expect(shouldExposeProductOffer("CONFIGURABLE", price)).toBe(false);
    expect(shouldExposeProductOffer("CUSTOM_QUOTE", price)).toBe(false);

    const jsonLd = buildProductJsonLd({
      name: "Cheesecake",
      description: "Durazno",
      image: "https://example.com/p.jpg",
      url: "https://example.com/productos/cheesecake-de-durazno",
      type: "STANDARD",
      price,
    });
    expect(jsonLd.brand).toEqual({ "@type": "Brand", name: "DELIVERSO" });
    expect(jsonLd.offers).toMatchObject({
      "@type": "Offer",
      priceCurrency: "MXN",
      price: "450.00",
    });
    expect(jsonLd).not.toHaveProperty("aggregateRating");

    const quoteLd = buildProductJsonLd({
      name: "Torta a medida",
      description: null,
      image: null,
      url: "https://example.com/productos/torta",
      type: "CUSTOM_QUOTE",
      price: null,
    });
    expect(quoteLd.offers).toBeUndefined();
  });
});
