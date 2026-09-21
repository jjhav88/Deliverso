"use server";

import { writeAdminAuditLog } from "@/modules/audit/write-admin-audit-log";
import { requireAdmin } from "@/modules/auth/authorization/require-admin";
import { HOME_PAGE_ID } from "@/modules/content/singletons";
import { persistHomeCopy, type HomeCopyRecord } from "@/modules/home/cms-copy";
import { homeCmsSaveSchema } from "@/modules/home/validation";
import { homeFeaturedSaveSchema } from "@/modules/catalog/validation";
import { revalidateAdminHome } from "@/server/cache/revalidate-storefront";
import { getPrisma } from "@/server/db/prisma";

export type HomeSaveState = {
  error: string | null;
  success: string | null;
};

function booleanFromForm(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true";
}

export async function saveHomeCmsAction(
  _prev: HomeSaveState,
  formData: FormData,
): Promise<HomeSaveState> {
  const admin = await requireAdmin("/admin/home");
  const parsed = homeCmsSaveSchema.safeParse({
    visibility: {
      showIntroduction: booleanFromForm(formData.get("showIntroduction")),
      showFeaturedProducts: booleanFromForm(formData.get("showFeaturedProducts")),
      showUniverses: booleanFromForm(formData.get("showUniverses")),
      showPersonalization: booleanFromForm(formData.get("showPersonalization")),
      showValueProposition: booleanFromForm(formData.get("showValueProposition")),
      showFinalCta: booleanFromForm(formData.get("showFinalCta")),
    },
    hero: {
      isActive: booleanFromForm(formData.get("heroActive")),
      tone: formData.get("heroTone") || "AUTO",
      leftMediaAssetId: String(formData.get("leftMediaAssetId") ?? ""),
      centerMediaAssetId: String(formData.get("centerMediaAssetId") ?? ""),
      rightMediaAssetId: String(formData.get("rightMediaAssetId") ?? ""),
    },
    es: {
      heroEyebrow: String(formData.get("es.heroEyebrow") ?? ""),
      heroHeadline: String(formData.get("es.heroHeadline") ?? ""),
      heroDescription: String(formData.get("es.heroDescription") ?? ""),
      introductionTitle: String(formData.get("es.introductionTitle") ?? ""),
      introductionBody: String(formData.get("es.introductionBody") ?? ""),
      featuredEyebrow: String(formData.get("es.featuredEyebrow") ?? ""),
      featuredTitle: String(formData.get("es.featuredTitle") ?? ""),
      universesTitle: String(formData.get("es.universesTitle") ?? ""),
      universesDescription: String(formData.get("es.universesDescription") ?? ""),
      personalizationTitle: String(formData.get("es.personalizationTitle") ?? ""),
      personalizationDescription: String(formData.get("es.personalizationDescription") ?? ""),
      finalCtaTitle: String(formData.get("es.finalCtaTitle") ?? ""),
      finalCtaDescription: String(formData.get("es.finalCtaDescription") ?? ""),
    },
    en: {
      heroEyebrow: String(formData.get("en.heroEyebrow") ?? ""),
      heroHeadline: String(formData.get("en.heroHeadline") ?? ""),
      heroDescription: String(formData.get("en.heroDescription") ?? ""),
      introductionTitle: String(formData.get("en.introductionTitle") ?? ""),
      introductionBody: String(formData.get("en.introductionBody") ?? ""),
      featuredEyebrow: String(formData.get("en.featuredEyebrow") ?? ""),
      featuredTitle: String(formData.get("en.featuredTitle") ?? ""),
      universesTitle: String(formData.get("en.universesTitle") ?? ""),
      universesDescription: String(formData.get("en.universesDescription") ?? ""),
      personalizationTitle: String(formData.get("en.personalizationTitle") ?? ""),
      personalizationDescription: String(formData.get("en.personalizationDescription") ?? ""),
      finalCtaTitle: String(formData.get("en.finalCtaTitle") ?? ""),
      finalCtaDescription: String(formData.get("en.finalCtaDescription") ?? ""),
    },
  });

  if (!parsed.success) {
    return { error: "Revisa los campos del inicio.", success: null };
  }

  const featuredParsed = homeFeaturedSaveSchema.safeParse({
    products: [1, 2, 3].map((sortOrder) => ({
      productId: String(formData.get(`featuredProductId-${sortOrder}`) ?? ""),
      sortOrder,
      isActive: booleanFromForm(formData.get(`featuredProductActive-${sortOrder}`)),
    })),
    universes: [1, 2, 3, 4].map((sortOrder) => ({
      universeId: String(formData.get(`featuredUniverseId-${sortOrder}`) ?? ""),
      sortOrder,
      isActive: booleanFromForm(formData.get(`featuredUniverseActive-${sortOrder}`)),
    })),
  });

  if (!featuredParsed.success) {
    return { error: "Revisa los destacados del inicio.", success: null };
  }

  const selectedProductIds = featuredParsed.data.products
    .map((item) => item.productId)
    .filter((id): id is string => Boolean(id));
  const selectedUniverseIds = featuredParsed.data.universes
    .map((item) => item.universeId)
    .filter((id): id is string => Boolean(id));

  if (new Set(selectedProductIds).size !== selectedProductIds.length) {
    return { error: "No repitas el mismo producto destacado.", success: null };
  }
  if (new Set(selectedUniverseIds).size !== selectedUniverseIds.length) {
    return { error: "No repitas el mismo universo destacado.", success: null };
  }

  const mediaIds = [
    parsed.data.hero.leftMediaAssetId,
    parsed.data.hero.centerMediaAssetId,
    parsed.data.hero.rightMediaAssetId,
  ].filter((id): id is string => Boolean(id));

  const prisma = getPrisma();

  if (mediaIds.length > 0) {
    const found = await prisma.mediaAsset.findMany({
      where: { id: { in: mediaIds } },
      select: { id: true },
    });
    if (found.length !== mediaIds.length) {
      return { error: "Una imagen del Hero ya no existe.", success: null };
    }
  }

  if (selectedProductIds.length > 0) {
    const published = await prisma.product.count({
      where: { id: { in: selectedProductIds }, status: "PUBLISHED" },
    });
    if (published !== selectedProductIds.length) {
      return {
        error: "Solo puedes destacar productos publicados.",
        success: null,
      };
    }
  }

  if (selectedUniverseIds.length > 0) {
    const active = await prisma.universe.count({
      where: { id: { in: selectedUniverseIds }, isActive: true },
    });
    if (active !== selectedUniverseIds.length) {
      return {
        error: "Solo puedes destacar universos activos.",
        success: null,
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.homePage.upsert({
      where: { id: HOME_PAGE_ID },
      create: {
        id: HOME_PAGE_ID,
        isActive: true,
        ...parsed.data.visibility,
      },
      update: parsed.data.visibility,
    });

    const existingEs = await tx.homePageTranslation.findUnique({
      where: { homePageId_locale: { homePageId: HOME_PAGE_ID, locale: "es-MX" } },
    });
    const existingEn = await tx.homePageTranslation.findUnique({
      where: { homePageId_locale: { homePageId: HOME_PAGE_ID, locale: "en-US" } },
    });
    const esCopy = persistHomeCopy(parsed.data.es as HomeCopyRecord, existingEs);
    const enCopy = persistHomeCopy(parsed.data.en as HomeCopyRecord, existingEn);

    await tx.homePageTranslation.upsert({
      where: { homePageId_locale: { homePageId: HOME_PAGE_ID, locale: "es-MX" } },
      create: { homePageId: HOME_PAGE_ID, locale: "es-MX", ...esCopy },
      update: esCopy,
    });
    await tx.homePageTranslation.upsert({
      where: { homePageId_locale: { homePageId: HOME_PAGE_ID, locale: "en-US" } },
      create: { homePageId: HOME_PAGE_ID, locale: "en-US", ...enCopy },
      update: enCopy,
    });

    const existingHero = await tx.homeHero.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    const hero = existingHero
      ? await tx.homeHero.update({
          where: { id: existingHero.id },
          data: {
            isActive: parsed.data.hero.isActive,
            tone: parsed.data.hero.tone,
          },
        })
      : await tx.homeHero.create({
          data: {
            isActive: parsed.data.hero.isActive,
            tone: parsed.data.hero.tone,
          },
        });

    await tx.homeHeroShowcaseItem.deleteMany({ where: { homeHeroId: hero.id } });

    const slots = [
      parsed.data.hero.leftMediaAssetId,
      parsed.data.hero.centerMediaAssetId,
      parsed.data.hero.rightMediaAssetId,
    ];

    await tx.homeHeroShowcaseItem.createMany({
      data: slots.map((mediaAssetId, sortOrder) => ({
        homeHeroId: hero.id,
        mediaAssetId,
        sortOrder,
        isActive: Boolean(mediaAssetId),
      })),
    });

    if (selectedProductIds.length > 0) {
      const published = await tx.product.findMany({
        where: { id: { in: selectedProductIds }, status: "PUBLISHED" },
        select: { id: true },
      });
      if (published.length !== selectedProductIds.length) {
        throw new Error("FEATURED_PRODUCT_INVALID");
      }
    }

    if (selectedUniverseIds.length > 0) {
      const active = await tx.universe.findMany({
        where: { id: { in: selectedUniverseIds }, isActive: true },
        select: { id: true },
      });
      if (active.length !== selectedUniverseIds.length) {
        throw new Error("FEATURED_UNIVERSE_INVALID");
      }
    }

    await tx.homeFeaturedProduct.deleteMany();
    await tx.homeFeaturedProduct.createMany({
      data: featuredParsed.data.products
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId as string,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        })),
    });

    await tx.homeFeaturedUniverse.deleteMany();
    await tx.homeFeaturedUniverse.createMany({
      data: featuredParsed.data.universes
        .filter((item) => item.universeId)
        .map((item) => ({
          universeId: item.universeId as string,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        })),
    });
  });

  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "HOME_CONTENT_UPDATED",
    resourceType: "HomePage",
    resourceId: HOME_PAGE_ID,
  });
  await writeAdminAuditLog({
    actorAdminId: admin.id,
    action: "HOME_HERO_UPDATED",
    resourceType: "HomeHero",
  });

  revalidateAdminHome();
  return { error: null, success: "Inicio actualizado." };
}
