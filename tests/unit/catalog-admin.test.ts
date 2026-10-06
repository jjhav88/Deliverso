import { describe, expect, it } from "vitest";
import {
  canSelectForHomeFeatured,
  nextStatusAfterArchive,
  nextStatusAfterReactivate,
} from "@/modules/catalog/archive";
import {
  MAX_HOME_FEATURED_PRODUCTS,
  capFeaturedSlots,
  isValidFeaturedCount,
} from "@/modules/catalog/featured";
import { leadTimeToMinutes, minutesToLeadTime } from "@/modules/catalog/lead-time";
import { moneyInputToMinor, minorToMoneyInput } from "@/modules/catalog/money-input";
import {
  hasSinglePrimary,
  normalizeProductMedia,
} from "@/modules/catalog/product-media";
import { canPublishProduct, getPublishBlockers } from "@/modules/catalog/publish";
import { isSafeSlug, slugifyName } from "@/modules/catalog/slug";
import {
  applyLockedProductSlugs,
  isProductPublicSlugLocked,
  publishedSlugMutationError,
  PUBLISHED_PRODUCT_SLUG_LOCKED_MESSAGE,
} from "@/modules/catalog/slug-guard";
import { productDetailHref } from "@/modules/catalog/public/href";

describe("money input helpers", () => {
  it("converts decimal UI strings to minor units", () => {
    expect(moneyInputToMinor("450.00")).toBe(45000);
    expect(moneyInputToMinor("450")).toBe(45000);
    expect(moneyInputToMinor("450,50")).toBe(45050);
    expect(moneyInputToMinor("")).toBeNull();
  });

  it("converts minor units back to a UI string", () => {
    expect(minorToMoneyInput(45000)).toBe("450.00");
    expect(minorToMoneyInput(null)).toBe("");
    expect(minorToMoneyInput(0)).toBe("0.00");
  });

  it("rejects malformed decimals", () => {
    expect(() => moneyInputToMinor("45.123")).toThrow(/inválido/i);
    expect(() => moneyInputToMinor("abc")).toThrow(/inválido/i);
  });
});

describe("slug validation", () => {
  it("slugifies names into safe URL fragments", () => {
    expect(slugifyName("Cheesecake de durazno")).toBe("cheesecake-de-durazno");
    expect(isSafeSlug("cheesecake-de-durazno")).toBe(true);
    expect(isSafeSlug("Cheesecake")).toBe(false);
    expect(isSafeSlug("a--b")).toBe(false);
  });
});

describe("published product slug guard", () => {
  it("locks PUBLISHED slugs and previously published ARCHIVED slugs", () => {
    expect(
      isProductPublicSlugLocked({ status: "PUBLISHED", publishedAt: new Date() }),
    ).toBe(true);
    expect(
      isProductPublicSlugLocked({
        status: "ARCHIVED",
        publishedAt: new Date(),
      }),
    ).toBe(true);
  });

  it("keeps DRAFT slugs editable, including after reactivate", () => {
    expect(
      isProductPublicSlugLocked({ status: "DRAFT", publishedAt: null }),
    ).toBe(false);
    expect(
      isProductPublicSlugLocked({ status: "DRAFT", publishedAt: new Date() }),
    ).toBe(false);
    expect(
      isProductPublicSlugLocked({ status: "ARCHIVED", publishedAt: null }),
    ).toBe(false);
  });

  it("rejects a published slug mutation server-side even if the form is tampered", () => {
    expect(
      publishedSlugMutationError({
        submittedEsSlug: "cheesecake-de-zarzamora",
        submittedEnSlug: "",
        storedEsSlug: "cheescake-de-zarzamora",
        storedEnSlug: null,
      }),
    ).toBe(PUBLISHED_PRODUCT_SLUG_LOCKED_MESSAGE);
    expect(
      publishedSlugMutationError({
        submittedEsSlug: "cheescake-de-zarzamora",
        submittedEnSlug: "changed-en",
        storedEsSlug: "cheescake-de-zarzamora",
        storedEnSlug: "blackberry-cheesecake",
      }),
    ).toBe(PUBLISHED_PRODUCT_SLUG_LOCKED_MESSAGE);
  });

  it("accepts the stored slug and overwrites submitted values when locked", () => {
    expect(
      publishedSlugMutationError({
        submittedEsSlug: "cheesecake-de-zarzamora",
        submittedEnSlug: "",
        storedEsSlug: "cheesecake-de-zarzamora",
        storedEnSlug: null,
      }),
    ).toBeNull();

    const next = applyLockedProductSlugs(
      {
        es: { slug: "tampered-slug" },
        en: { slug: "tampered-en" },
      },
      { es: "cheesecake-de-zarzamora", en: null },
    );
    expect(next.es.slug).toBe("cheesecake-de-zarzamora");
    expect(next.en.slug).toBe("tampered-en");
  });

  it("builds public product hrefs from the current catalog slug", () => {
    expect(productDetailHref("cheesecake-de-zarzamora")).toEqual({
      pathname: "/productos/[slug]",
      params: { slug: "cheesecake-de-zarzamora" },
    });
  });
});

describe("publish validation", () => {
  const base = {
    businessLineId: "11111111-1111-4111-8111-111111111111",
    nameEs: "Cheesecake",
    slugEs: "cheesecake",
    primaryMediaAssetId: "11111111-1111-4111-8111-111111111112",
  };

  it("requires a price for STANDARD and CONFIGURABLE", () => {
    expect(
      canPublishProduct({ ...base, type: "STANDARD", priceMinor: null }),
    ).toBe(false);
    expect(
      getPublishBlockers({ ...base, type: "CONFIGURABLE", priceMinor: null })[0],
    ).toMatch(/precio/i);
    expect(
      canPublishProduct({ ...base, type: "STANDARD", priceMinor: 45000 }),
    ).toBe(true);
  });

  it("allows CUSTOM_QUOTE without a price and never treats 0 as quote", () => {
    expect(
      canPublishProduct({ ...base, type: "CUSTOM_QUOTE", priceMinor: null }),
    ).toBe(true);
    expect(
      canPublishProduct({ ...base, type: "CUSTOM_QUOTE", priceMinor: 0 }),
    ).toBe(true);
  });
});

describe("product media primary invariant", () => {
  it("keeps a single PRIMARY and reindexes gallery", () => {
    const normalized = normalizeProductMedia([
      { mediaAssetId: "a", role: "PRIMARY", sortOrder: 9 },
      { mediaAssetId: "b", role: "GALLERY", sortOrder: 0 },
      { mediaAssetId: "c", role: "GALLERY", sortOrder: 0 },
    ]);
    expect(hasSinglePrimary(normalized)).toBe(true);
    expect(normalized.map((item) => item.role)).toEqual([
      "PRIMARY",
      "GALLERY",
      "GALLERY",
    ]);
    expect(normalized.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });

  it("rejects more than one PRIMARY", () => {
    expect(() =>
      normalizeProductMedia([
        { mediaAssetId: "a", role: "PRIMARY", sortOrder: 0 },
        { mediaAssetId: "b", role: "PRIMARY", sortOrder: 1 },
      ]),
    ).toThrow(/principal/i);
  });
});

describe("featured product cap", () => {
  it("caps Home featured products at 3", () => {
    expect(MAX_HOME_FEATURED_PRODUCTS).toBe(3);
    expect(capFeaturedSlots([1, 2, 3, 4], 3)).toEqual([1, 2, 3]);
    expect(isValidFeaturedCount(3, 3)).toBe(true);
    expect(isValidFeaturedCount(4, 3)).toBe(false);
  });
});

describe("archive transitions", () => {
  it("archives without deleting and reactivates to draft", () => {
    expect(nextStatusAfterArchive()).toBe("ARCHIVED");
    expect(nextStatusAfterReactivate()).toBe("DRAFT");
    expect(canSelectForHomeFeatured("PUBLISHED")).toBe(true);
    expect(canSelectForHomeFeatured("DRAFT")).toBe(false);
    expect(canSelectForHomeFeatured("ARCHIVED")).toBe(false);
  });

  it("keeps archive distinct from a hard delete", () => {
    expect(nextStatusAfterArchive()).not.toBe("DELETED");
  });
});

describe("lead time conversion", () => {
  it("stores hours and days as minutes", () => {
    expect(leadTimeToMinutes({ value: 48, unit: "hours" })).toBe(2880);
    expect(leadTimeToMinutes({ value: 2, unit: "days" })).toBe(2880);
    expect(leadTimeToMinutes({ value: null, unit: "hours" })).toBeNull();
    expect(minutesToLeadTime(2880)).toEqual({ value: 2, unit: "days" });
  });
});
