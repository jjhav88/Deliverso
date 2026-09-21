import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { priceConfiguredProduct } from "@/modules/catalog/pricing/price-configured-product";
import type { PricingSnapshot } from "@/modules/catalog/pricing/types";

type Translation = { locale: string; name: string; slug?: string };

function pickLocale<T extends Translation>(rows: readonly T[], locale: string): T | undefined {
  return rows.find((row) => row.locale === locale) ?? rows[0];
}

export function buildOrderItemSnapshots(
  rows: ReadonlyArray<{
    quantity: number;
    product: {
      id: string;
      type: "STANDARD" | "CONFIGURABLE" | "CUSTOM_QUOTE";
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      translations: Array<{ locale: string; name: string; slug: string }>;
      optionGroups: Array<{
        id: string;
        selectionType: "SINGLE" | "MULTIPLE";
        isRequired: boolean;
        minSelections: number;
        maxSelections: number;
        isActive: boolean;
        translations: Array<{ locale: string; name: string }>;
        options: Array<{
          id: string;
          isActive: boolean;
          priceDeltaMinor: number;
          translations: Array<{ locale: string; name: string }>;
        }>;
      }>;
      media: Array<{ mediaAsset: { bucket: string; objectPath: string } }>;
    };
    variant: {
      id: string;
      isActive: boolean;
      priceMinor: number | null;
      translations: Array<{ locale: string; name: string }>;
    };
    options: Array<{ optionId: string }>;
  }>,
) {
  return rows.map((row, index) => {
    const snapshot: PricingSnapshot = {
      productId: row.product.id,
      type: row.product.type,
      status: row.product.status,
      variant: row.variant,
      groups: row.product.optionGroups.map((group) => ({
        id: group.id,
        selectionType: group.selectionType,
        isRequired: group.isRequired,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isActive: group.isActive,
        options: group.options.map((option) => ({
          id: option.id,
          isActive: option.isActive,
          priceDeltaMinor: option.priceDeltaMinor,
        })),
      })),
    };
    const selectedOptionIds = row.options.map((item) => item.optionId);
    const priced = priceConfiguredProduct({
      snapshot,
      selectedOptionIds,
      quantity: row.quantity,
    });
    if (!priced.ok) {
      throw new Error(priced.message);
    }

    const nameEs = pickLocale(row.product.translations, "es-MX");
    const nameEn = row.product.translations.find((item) => item.locale === "en-US");
    const variantEs = pickLocale(row.variant.translations, "es-MX");
    const variantEn = row.variant.translations.find((item) => item.locale === "en-US");
    const primary = row.product.media[0]?.mediaAsset;

    const optionSnapshots = row.product.optionGroups.flatMap((group) => {
      const selected = group.options.filter((option) => selectedOptionIds.includes(option.id));
      return selected.map((option, optionIndex) => ({
        optionGroupId: group.id,
        optionId: option.id,
        groupNameEs: pickLocale(group.translations, "es-MX")?.name ?? group.id,
        groupNameEn: group.translations.find((item) => item.locale === "en-US")?.name ?? null,
        optionNameEs: pickLocale(option.translations, "es-MX")?.name ?? option.id,
        optionNameEn: option.translations.find((item) => item.locale === "en-US")?.name ?? null,
        priceDeltaMinor: option.priceDeltaMinor,
        sortOrder: optionIndex,
      }));
    });

    return {
      productId: row.product.id,
      variantId: row.variant.id,
      productType: row.product.type,
      quantity: row.quantity,
      baseUnitPriceMinor: priced.baseUnitPriceMinor,
      optionsDeltaMinor: priced.optionsDeltaMinor,
      configuredUnitPriceMinor: priced.configuredUnitPriceMinor,
      lineTotalMinor: priced.lineTotalMinor,
      currencyCode: "MXN" as const,
      productNameEs: nameEs?.name ?? "Producto",
      productNameEn: nameEn?.name ?? null,
      productSlugEs: nameEs?.slug ?? null,
      productSlugEn: nameEn?.slug ?? null,
      variantNameEs: variantEs?.name ?? null,
      variantNameEn: variantEn?.name ?? null,
      primaryImageSnapshot: primary ? mediaAssetPublicUrl(primary) : null,
      sortOrder: index,
      options: optionSnapshots,
    };
  });
}
