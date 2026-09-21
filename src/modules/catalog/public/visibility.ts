import type { ProductStatus } from "@/modules/catalog/domain";

export function isPublicProductStatus(status: ProductStatus): boolean {
  return status === "PUBLISHED";
}

export function shouldOmitFromLocaleCatalog(
  locale: string,
  hasLocaleTranslation: boolean,
): boolean {
  if (locale === "es-MX") {
    return !hasLocaleTranslation;
  }

  if (locale === "en-US") {
    return !hasLocaleTranslation;
  }

  return true;
}
