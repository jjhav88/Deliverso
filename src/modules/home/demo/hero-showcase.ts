import type { HeroShowcasePosition } from "@/modules/home/types/home-content";

/**
 * TEMPORARY HOME DEMO DATA
 * Replace with Admin/CMS product placements.
 *
 * These are presentation slots for the Hero product placements.
 * They are not catalog products, SKUs, prices, or featured-section items.
 * Hero showcase and Featured Products remain independently selectable.
 */

export const MAX_HERO_SHOWCASE_ITEMS = 3;

export const heroShowcaseDemo = [
  { id: "hero-left", position: "left" },
  { id: "hero-right", position: "right" },
  { id: "hero-right-secondary", position: "rightSecondary" },
] as const satisfies readonly {
  id: string;
  position: HeroShowcasePosition;
}[];
