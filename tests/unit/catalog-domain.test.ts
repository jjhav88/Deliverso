import { describe, expect, it } from "vitest";
import { isAppLocale, supportedLocales } from "@/config/i18n";
import { baseCurrency } from "@/config/currency";
import {
  assertMasterCurrency,
  hasMasterPrice,
  isHeroTone,
  isMasterCurrency,
  isProductStatus,
  isProductType,
  parsePersistableLocale,
  productTypes,
} from "@/modules/catalog/domain";

describe("catalog product types", () => {
  it("accepts the three persisted product types", () => {
    expect(productTypes).toEqual([
      "STANDARD",
      "CONFIGURABLE",
      "CUSTOM_QUOTE",
    ]);
    expect(isProductType("STANDARD")).toBe(true);
    expect(isProductType("BUNDLE")).toBe(false);
  });

  it("accepts product statuses without treating archive as delete", () => {
    expect(isProductStatus("DRAFT")).toBe(true);
    expect(isProductStatus("PUBLISHED")).toBe(true);
    expect(isProductStatus("ARCHIVED")).toBe(true);
    expect(isProductStatus("DELETED")).toBe(false);
  });
});

describe("persistable locales", () => {
  it("validates against supportedLocales instead of a closed Prisma enum", () => {
    expect(supportedLocales).toEqual(["es-MX", "en-US"]);
    expect(parsePersistableLocale("es-MX")).toBe("es-MX");
    expect(parsePersistableLocale("en-US")).toBe("en-US");
    expect(isAppLocale("fr-FR")).toBe(false);
    expect(() => parsePersistableLocale("fr-FR")).toThrow(/unsupported locale/i);
  });
});

describe("master money", () => {
  it("treats MXN as the only master currency", () => {
    expect(isMasterCurrency(baseCurrency)).toBe(true);
    expect(isMasterCurrency("USD")).toBe(false);
    expect(() => assertMasterCurrency("EUR")).toThrow(/MXN/);
  });

  it("never treats 0 as a missing price", () => {
    expect(hasMasterPrice(null)).toBe(false);
    expect(hasMasterPrice(undefined)).toBe(false);
    expect(hasMasterPrice(0)).toBe(true);
    expect(hasMasterPrice(45000)).toBe(true);
  });
});

describe("hero tone", () => {
  it("mirrors the persistence enum without importing Prisma", () => {
    expect(isHeroTone("AUTO")).toBe(true);
    expect(isHeroTone("LIGHT")).toBe(true);
    expect(isHeroTone("DARK")).toBe(true);
    expect(isHeroTone("light")).toBe(false);
  });
});
