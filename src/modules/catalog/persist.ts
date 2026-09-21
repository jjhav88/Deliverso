import type { Prisma } from "@/generated/prisma/client";
import { assertMasterCurrency } from "@/modules/catalog/domain/money";
import { leadTimeToMinutes } from "@/modules/catalog/lead-time";
import { moneyInputToMinor } from "@/modules/catalog/money-input";
import { normalizeProductMedia } from "@/modules/catalog/product-media";
import type { ProductSaveInput } from "@/modules/catalog/validation";
import type { ProductStatus } from "@/modules/catalog/domain";

type CatalogTx = Prisma.TransactionClient;

function hasEnglishProduct(input: ProductSaveInput["en"]): boolean {
  return Boolean(input.name && input.slug);
}

function hasEnglishTaxonomy(input: { name: string; slug: string }): boolean {
  return Boolean(input.name && input.slug);
}

export function resolvePriceMinor(input: ProductSaveInput): number | null {
  if (input.type === "CUSTOM_QUOTE" && input.quotePrice) {
    return null;
  }

  const minor = moneyInputToMinor(input.priceInput);
  if (minor !== null) {
    assertMasterCurrency("MXN");
  }
  return minor;
}

export async function persistProductRecord(
  tx: CatalogTx,
  input: ProductSaveInput,
  status: ProductStatus,
  existingId: string | null,
): Promise<string> {
  const priceMinor = resolvePriceMinor(input);
  const minimumLeadTimeMinutes = leadTimeToMinutes({
    value: input.leadTimeValue,
    unit: input.leadTimeUnit,
  });
  const media = normalizeProductMedia([
    ...(input.primaryMediaAssetId
      ? [
          {
            mediaAssetId: input.primaryMediaAssetId,
            role: "PRIMARY" as const,
            sortOrder: 0,
          },
        ]
      : []),
    ...input.galleryMediaAssetIds
      .filter((id) => id !== input.primaryMediaAssetId)
      .map((mediaAssetId, index) => ({
        mediaAssetId,
        role: "GALLERY" as const,
        sortOrder: index + 1,
      })),
  ]);

  const productData = {
    businessLineId: input.businessLineId,
    type: input.type,
    status,
    minimumLeadTimeMinutes,
  };

  const product = existingId
    ? await tx.product.update({
        where: { id: existingId },
        data: productData,
      })
    : await tx.product.create({ data: productData });

  await tx.productTranslation.upsert({
    where: { productId_locale: { productId: product.id, locale: "es-MX" } },
    create: {
      productId: product.id,
      locale: "es-MX",
      name: input.es.name,
      slug: input.es.slug,
      shortDescription: input.es.shortDescription,
      description: input.es.description,
      seoTitle: input.es.seoTitle,
      seoDescription: input.es.seoDescription,
    },
    update: {
      name: input.es.name,
      slug: input.es.slug,
      shortDescription: input.es.shortDescription,
      description: input.es.description,
      seoTitle: input.es.seoTitle,
      seoDescription: input.es.seoDescription,
    },
  });

  if (hasEnglishProduct(input.en)) {
    await tx.productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: "en-US" } },
      create: {
        productId: product.id,
        locale: "en-US",
        name: input.en.name,
        slug: input.en.slug,
        shortDescription: input.en.shortDescription,
        description: input.en.description,
        seoTitle: input.en.seoTitle,
        seoDescription: input.en.seoDescription,
      },
      update: {
        name: input.en.name,
        slug: input.en.slug,
        shortDescription: input.en.shortDescription,
        description: input.en.description,
        seoTitle: input.en.seoTitle,
        seoDescription: input.en.seoDescription,
      },
    });
  } else {
    await tx.productTranslation.deleteMany({
      where: { productId: product.id, locale: "en-US" },
    });
  }

  const defaultVariant = await tx.productVariant.findFirst({
    where: { productId: product.id, isDefault: true },
  });

  const variantData = {
    sku: input.sku,
    isDefault: true,
    isActive: true,
    sortOrder: 0,
    priceMinor,
    currencyCode: "MXN",
  };

  if (defaultVariant) {
    await tx.productVariant.update({
      where: { id: defaultVariant.id },
      data: variantData,
    });
  } else {
    await tx.productVariant.create({
      data: { productId: product.id, ...variantData },
    });
  }

  await tx.productCategory.deleteMany({ where: { productId: product.id } });
  if (input.categoryIds.length > 0) {
    await tx.productCategory.createMany({
      data: input.categoryIds.map((categoryId, index) => ({
        productId: product.id,
        categoryId,
        sortOrder: index,
      })),
    });
  }

  await tx.productUniverse.deleteMany({ where: { productId: product.id } });
  if (input.universeIds.length > 0) {
    await tx.productUniverse.createMany({
      data: input.universeIds.map((universeId, index) => ({
        productId: product.id,
        universeId,
        sortOrder: index,
      })),
    });
  }

  await tx.productMedia.deleteMany({ where: { productId: product.id } });
  if (media.length > 0) {
    await tx.productMedia.createMany({
      data: media.map((item) => ({
        productId: product.id,
        mediaAssetId: item.mediaAssetId,
        role: item.role,
        sortOrder: item.sortOrder,
      })),
    });
  }

  return product.id;
}

export async function persistTaxonomyTranslations(
  tx: CatalogTx,
  model: "businessLine" | "category" | "universe",
  parentId: string,
  es: { name: string; slug: string; description: string | null },
  en: { name: string; slug: string; description: string | null },
) {
  if (model === "businessLine") {
    await tx.businessLineTranslation.upsert({
      where: {
        businessLineId_locale: { businessLineId: parentId, locale: "es-MX" },
      },
      create: { businessLineId: parentId, locale: "es-MX", ...es },
      update: es,
    });
    if (hasEnglishTaxonomy(en)) {
      await tx.businessLineTranslation.upsert({
        where: {
          businessLineId_locale: { businessLineId: parentId, locale: "en-US" },
        },
        create: { businessLineId: parentId, locale: "en-US", ...en },
        update: en,
      });
    } else {
      await tx.businessLineTranslation.deleteMany({
        where: { businessLineId: parentId, locale: "en-US" },
      });
    }
    return;
  }

  if (model === "category") {
    await tx.categoryTranslation.upsert({
      where: { categoryId_locale: { categoryId: parentId, locale: "es-MX" } },
      create: { categoryId: parentId, locale: "es-MX", ...es },
      update: es,
    });
    if (hasEnglishTaxonomy(en)) {
      await tx.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: parentId, locale: "en-US" } },
        create: { categoryId: parentId, locale: "en-US", ...en },
        update: en,
      });
    } else {
      await tx.categoryTranslation.deleteMany({
        where: { categoryId: parentId, locale: "en-US" },
      });
    }
    return;
  }

  await tx.universeTranslation.upsert({
    where: { universeId_locale: { universeId: parentId, locale: "es-MX" } },
    create: { universeId: parentId, locale: "es-MX", ...es },
    update: es,
  });
  if (hasEnglishTaxonomy(en)) {
    await tx.universeTranslation.upsert({
      where: { universeId_locale: { universeId: parentId, locale: "en-US" } },
      create: { universeId: parentId, locale: "en-US", ...en },
      update: en,
    });
  } else {
    await tx.universeTranslation.deleteMany({
      where: { universeId: parentId, locale: "en-US" },
    });
  }
}
