import { hasMasterPrice } from "@/modules/catalog/domain/money";
import type { ProductStatus, ProductType } from "@/modules/catalog/domain";

export type PublishCandidate = {
  type: ProductType;
  status?: ProductStatus;
  businessLineId: string | null;
  nameEs: string;
  slugEs: string;
  primaryMediaAssetId: string | null;
  priceMinor: number | null;
};

export function getPublishBlockers(candidate: PublishCandidate): string[] {
  const blockers: string[] = [];

  if (!candidate.businessLineId) {
    blockers.push("Selecciona una línea de negocio.");
  }

  if (!candidate.nameEs.trim()) {
    blockers.push("El nombre en español es obligatorio.");
  }

  if (!candidate.slugEs.trim()) {
    blockers.push("El slug en español es obligatorio.");
  }

  if (!candidate.primaryMediaAssetId) {
    blockers.push("Selecciona una imagen principal.");
  }

  if (candidate.type !== "CUSTOM_QUOTE" && !hasMasterPrice(candidate.priceMinor)) {
    blockers.push("Define un precio en MXN para publicar este producto.");
  }

  return blockers;
}

export function canPublishProduct(candidate: PublishCandidate): boolean {
  return getPublishBlockers(candidate).length === 0;
}
