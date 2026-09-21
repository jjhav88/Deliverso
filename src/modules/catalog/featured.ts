export const MAX_HOME_FEATURED_PRODUCTS = 3;
export const MAX_HOME_FEATURED_UNIVERSES = 4;

export function capFeaturedSlots<T>(items: readonly T[], max: number): T[] {
  return items.slice(0, Math.max(0, max));
}

export function isValidFeaturedCount(count: number, max: number): boolean {
  return count >= 0 && count <= max;
}
