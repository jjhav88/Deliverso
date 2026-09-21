export const MAX_FEATURED_HOME_PRODUCTS = 3;

/**
 * Caps the Home featured collection so the landing never reads as a full catalog.
 * The same helper can later wrap a CMS/admin selection.
 */
export function selectFeaturedProducts<T>(
  items: readonly T[],
  max = MAX_FEATURED_HOME_PRODUCTS,
): T[] {
  if (max <= 0) {
    return [];
  }

  return items.slice(0, max);
}
