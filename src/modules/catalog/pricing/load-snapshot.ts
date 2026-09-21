import "server-only";
import { getPrisma } from "@/server/db/prisma";
import type { PricingSnapshot } from "@/modules/catalog/pricing/types";

export async function loadPricingSnapshot(input: {
  productId: string;
  variantId?: string | null;
}): Promise<PricingSnapshot | null> {
  const product = await getPrisma().product.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      type: true,
      status: true,
      variants: {
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
        select: { id: true, isActive: true, priceMinor: true, isDefault: true },
      },
      optionGroups: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          selectionType: true,
          isRequired: true,
          minSelections: true,
          maxSelections: true,
          isActive: true,
          options: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, isActive: true, priceDeltaMinor: true },
          },
        },
      },
    },
  });

  if (!product) {
    return null;
  }

  const variant = input.variantId
    ? product.variants.find((item) => item.id === input.variantId)
    : product.variants.find((item) => item.isDefault) ?? product.variants[0];

  if (!variant) {
    return null;
  }

  return {
    productId: product.id,
    type: product.type,
    status: product.status,
    variant: {
      id: variant.id,
      isActive: variant.isActive,
      priceMinor: variant.priceMinor,
    },
    groups: product.optionGroups,
  };
}
