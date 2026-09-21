import type { FeaturedProductTone } from "@/modules/home/types/home-content";

/**
 * TEMPORARY HOME DEMO DATA
 * Replace with repository/query when catalog persistence is implemented.
 *
 * These objects are presentation fixtures for the public Home only.
 * They are not a catalog, SKU list, inventory, price list, or commercial offer.
 */

export const featuredProductDemo = [
  { id: "chocolate-cake", tone: "cocoa" },
  { id: "fruit-creation", tone: "fruit" },
  { id: "special-edition", tone: "gold" },
] as const satisfies readonly {
  id: string;
  tone: FeaturedProductTone;
}[];

export type FeaturedProductDemoId = (typeof featuredProductDemo)[number]["id"];
