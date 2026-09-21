import { describe, expect, it } from "vitest";
import { featuredProductDemo } from "@/modules/home/demo/featured-products";
import { homeHeroDemo } from "@/modules/home/demo/hero";
import {
  heroShowcaseDemo,
  MAX_HERO_SHOWCASE_ITEMS,
} from "@/modules/home/demo/hero-showcase";
import { universeDemo } from "@/modules/home/demo/universes";
import {
  MAX_FEATURED_HOME_PRODUCTS,
  selectFeaturedProducts,
} from "@/modules/home/select-featured-products";
import { selectHeroShowcaseItems } from "@/modules/home/select-hero-showcase";

describe("home demo featured products", () => {
  it("stays within the Home featured cap", () => {
    expect(featuredProductDemo.length).toBeLessThanOrEqual(
      MAX_FEATURED_HOME_PRODUCTS,
    );
    expect(MAX_FEATURED_HOME_PRODUCTS).toBe(3);
  });

  it("uses unique presentation ids without catalog fields", () => {
    const ids = featuredProductDemo.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);

    for (const item of featuredProductDemo) {
      expect(item).not.toHaveProperty("price");
      expect(item).not.toHaveProperty("sku");
      expect(item).not.toHaveProperty("stock");
      expect(item).not.toHaveProperty("discount");
    }
  });

  it("selectFeaturedProducts slices without mutating the source", () => {
    const source = [1, 2, 3, 4, 5];
    const selected = selectFeaturedProducts(source, 3);

    expect(selected).toEqual([1, 2, 3]);
    expect(source).toHaveLength(5);
    expect(selectFeaturedProducts(featuredProductDemo)).toHaveLength(
      featuredProductDemo.length,
    );
  });
});

describe("home demo universes", () => {
  it("keeps a short generic set of presentation concepts", () => {
    const ids = universeDemo.map((item) => item.id);

    expect(ids).toEqual(["celebrations", "fantasy", "elegance", "custom"]);
    expect(ids).not.toContain("disney");
    expect(ids).not.toContain("harry-potter");
    expect(ids).not.toContain("marvel");
  });
});

describe("home demo hero media", () => {
  it("exposes an empty image slot until a local photograph exists", () => {
    expect(homeHeroDemo.backgroundImage).toBeUndefined();
    expect(homeHeroDemo.tone).toBe("light");
  });
});

describe("home demo hero showcase", () => {
  it("keeps three independently placed frames without catalog fields", () => {
    const positions = heroShowcaseDemo.map((item) => item.position);

    expect(heroShowcaseDemo).toHaveLength(MAX_HERO_SHOWCASE_ITEMS);
    expect(positions).toEqual(["left", "right", "rightSecondary"]);
    expect(selectHeroShowcaseItems(heroShowcaseDemo)).toHaveLength(3);

    for (const item of heroShowcaseDemo) {
      expect(item).not.toHaveProperty("price");
      expect(item).not.toHaveProperty("sku");
      expect(item).not.toHaveProperty("productHref");
      expect(item).not.toHaveProperty("name");
    }
  });
});
