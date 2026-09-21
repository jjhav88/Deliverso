import type { HomeHeroTone } from "@/modules/home/types/home-content";

/**
 * TEMPORARY HOME DEMO DATA
 * Replace with repository/query when catalog persistence is implemented.
 *
 * Hero media will later come from Admin/CMS:
 * - background image
 * - active/inactive
 * - optional promotional copy (institutional copy stays in i18n)
 *
 * Leave `backgroundImage` undefined until a local photograph exists.
 * Do not use remote stock URLs.
 */

export const homeHeroDemo = {
  backgroundImage: undefined as string | undefined,
  tone: "light" as HomeHeroTone,
};
