import type { ProductStatus } from "@/modules/catalog/domain";

export const PUBLISHED_PRODUCT_SLUG_LOCKED_MESSAGE =
  "El slug de un producto publicado forma parte de su URL pública. Para cambiarlo se requiere una migración SEO con redirección.";

export function isProductPublicSlugLocked(input: {
  status: ProductStatus;
  publishedAt: Date | null;
}): boolean {
  if (input.status === "PUBLISHED") {
    return true;
  }

  return input.status === "ARCHIVED" && input.publishedAt != null;
}

export function publishedSlugMutationError(input: {
  submittedEsSlug: string;
  submittedEnSlug: string;
  storedEsSlug: string | null;
  storedEnSlug: string | null;
}): string | null {
  if (!input.storedEsSlug) {
    return PUBLISHED_PRODUCT_SLUG_LOCKED_MESSAGE;
  }

  if (input.submittedEsSlug !== input.storedEsSlug) {
    return PUBLISHED_PRODUCT_SLUG_LOCKED_MESSAGE;
  }

  if (input.storedEnSlug && input.submittedEnSlug !== input.storedEnSlug) {
    return PUBLISHED_PRODUCT_SLUG_LOCKED_MESSAGE;
  }

  return null;
}

export function applyLockedProductSlugs<
  T extends { es: { slug: string }; en: { slug: string } },
>(input: T, stored: { es: string | null; en: string | null }): T {
  return {
    ...input,
    es: {
      ...input.es,
      slug: stored.es ?? input.es.slug,
    },
    en: {
      ...input.en,
      slug: stored.en ?? input.en.slug,
    },
  };
}
