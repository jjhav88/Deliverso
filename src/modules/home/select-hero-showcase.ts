import {
  selectScheduledPlacements,
  type ScheduledPlacement,
} from "@/lib/scheduling";
import { MAX_HERO_SHOWCASE_ITEMS } from "@/modules/home/demo/hero-showcase";

/**
 * Caps visible Hero showcase frames.
 * Persistence may store N placements; the application layer selects a few.
 */
export function selectHeroShowcaseItems<T>(
  items: readonly T[],
  max = MAX_HERO_SHOWCASE_ITEMS,
): T[] {
  if (max <= 0) {
    return [];
  }

  return items.slice(0, max);
}

/**
 * Future Home query helper: active + in-window + sortOrder, then cap at 3.
 * The database does not enforce exactly three showcase rows.
 */
export function selectVisibleHeroShowcaseItems<T extends ScheduledPlacement>(
  items: readonly T[],
  now: Date,
  max = MAX_HERO_SHOWCASE_ITEMS,
): T[] {
  return selectScheduledPlacements(items, now, max);
}
