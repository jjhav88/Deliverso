import type { ProductStatus } from "@/modules/catalog/domain";

export function nextStatusAfterArchive(): ProductStatus {
  return "ARCHIVED";
}

export function nextStatusAfterReactivate(): ProductStatus {
  return "DRAFT";
}

export function canSelectForHomeFeatured(status: ProductStatus): boolean {
  return status === "PUBLISHED";
}
