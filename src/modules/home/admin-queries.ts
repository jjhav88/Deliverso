import "server-only";
import {
  listActiveUniversesForHome,
  listPublishedProductsForHome,
} from "@/modules/catalog/queries";
import { getHomeFeaturedAdminSlots } from "@/modules/home/featured-from-catalog";
import type { HeroTone } from "@/generated/prisma/enums";
import { HOME_PAGE_ID } from "@/modules/content/singletons";
import type { HomeCmsSaveInput } from "@/modules/home/validation";
import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";

export type HomeAdminHeroSlot = {
  mediaAssetId: string | null;
  publicUrl: string | null;
};

export type HomeAdminCopy = {
  heroEyebrow: string;
  heroHeadline: string;
  heroDescription: string;
  introductionTitle: string;
  introductionBody: string;
  featuredEyebrow: string;
  featuredTitle: string;
  universesTitle: string;
  universesDescription: string;
  personalizationTitle: string;
  personalizationDescription: string;
  finalCtaTitle: string;
  finalCtaDescription: string;
};

const emptyCopy = (): HomeAdminCopy => ({
  heroEyebrow: "",
  heroHeadline: "",
  heroDescription: "",
  introductionTitle: "",
  introductionBody: "",
  featuredEyebrow: "",
  featuredTitle: "",
  universesTitle: "",
  universesDescription: "",
  personalizationTitle: "",
  personalizationDescription: "",
  finalCtaTitle: "",
  finalCtaDescription: "",
});

function copyFromTranslation(
  translation:
    | {
        heroEyebrow: string | null;
        heroHeadline: string | null;
        heroDescription: string | null;
        introductionTitle: string | null;
        introductionBody: string | null;
        featuredEyebrow: string | null;
        featuredTitle: string | null;
        universesTitle: string | null;
        universesDescription: string | null;
        personalizationTitle: string | null;
        personalizationDescription: string | null;
        finalCtaTitle: string | null;
        finalCtaDescription: string | null;
      }
    | undefined,
): HomeAdminCopy {
  const base = emptyCopy();
  if (!translation) return base;
  return {
    heroEyebrow: translation.heroEyebrow ?? "",
    heroHeadline: translation.heroHeadline ?? "",
    heroDescription: translation.heroDescription ?? "",
    introductionTitle: translation.introductionTitle ?? "",
    introductionBody: translation.introductionBody ?? "",
    featuredEyebrow: translation.featuredEyebrow ?? "",
    featuredTitle: translation.featuredTitle ?? "",
    universesTitle: translation.universesTitle ?? "",
    universesDescription: translation.universesDescription ?? "",
    personalizationTitle: translation.personalizationTitle ?? "",
    personalizationDescription: translation.personalizationDescription ?? "",
    finalCtaTitle: translation.finalCtaTitle ?? "",
    finalCtaDescription: translation.finalCtaDescription ?? "",
  };
}

export type HomeAdminState = {
  configured: boolean;
  visibility: HomeCmsSaveInput["visibility"];
  hero: {
    isActive: boolean;
    tone: HeroTone;
    left: HomeAdminHeroSlot;
    center: HomeAdminHeroSlot;
    right: HomeAdminHeroSlot;
  };
  es: HomeAdminCopy;
  en: HomeAdminCopy;
  featuredProducts: Array<{
    productId: string | null;
    sortOrder: number;
    isActive: boolean;
  }>;
  featuredUniverses: Array<{
    universeId: string | null;
    sortOrder: number;
    isActive: boolean;
  }>;
  publishedProducts: Array<{ id: string; name: string }>;
  activeUniverses: Array<{ id: string; name: string }>;
};

const defaultVisibility: HomeCmsSaveInput["visibility"] = {
  showIntroduction: true,
  showFeaturedProducts: true,
  showUniverses: true,
  showPersonalization: true,
  showValueProposition: true,
  showFinalCta: true,
};

function emptySlot(): HomeAdminHeroSlot {
  return { mediaAssetId: null, publicUrl: null };
}

export async function getHomeAdminState(): Promise<HomeAdminState> {
  if (!hasRuntimeDatabaseUrl()) {
    return {
      configured: false,
      visibility: defaultVisibility,
      hero: {
        isActive: true,
        tone: "AUTO",
        left: emptySlot(),
        center: emptySlot(),
        right: emptySlot(),
      },
      es: emptyCopy(),
      en: emptyCopy(),
      featuredProducts: [1, 2, 3].map((sortOrder) => ({
        productId: null,
        sortOrder,
        isActive: true,
      })),
      featuredUniverses: [1, 2, 3, 4].map((sortOrder) => ({
        universeId: null,
        sortOrder,
        isActive: true,
      })),
      publishedProducts: [],
      activeUniverses: [],
    };
  }

  const prisma = getPrisma();
  const page = await prisma.homePage.findUnique({
    where: { id: HOME_PAGE_ID },
    include: { translations: true },
  });
  const hero = await prisma.homeHero.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      showcaseItems: {
        orderBy: { sortOrder: "asc" },
        include: { mediaAsset: true },
      },
    },
  });

  const slotFromOrder = (sortOrder: number): HomeAdminHeroSlot => {
    const item = hero?.showcaseItems.find((entry) => entry.sortOrder === sortOrder);
    if (!item?.mediaAsset || !hasSupabaseAuthConfig()) {
      return emptySlot();
    }

    return {
      mediaAssetId: item.mediaAsset.id,
      publicUrl: mediaAssetPublicUrl(item.mediaAsset),
    };
  };

  const [slots, publishedProducts, activeUniverses] = await Promise.all([
    getHomeFeaturedAdminSlots(),
    listPublishedProductsForHome(),
    listActiveUniversesForHome(),
  ]);

  return {
    configured: Boolean(page),
    visibility: page
      ? {
          showIntroduction: page.showIntroduction,
          showFeaturedProducts: page.showFeaturedProducts,
          showUniverses: page.showUniverses,
          showPersonalization: page.showPersonalization,
          showValueProposition: page.showValueProposition,
          showFinalCta: page.showFinalCta,
        }
      : defaultVisibility,
    hero: {
      isActive: hero?.isActive ?? true,
      tone: hero?.tone ?? "AUTO",
      left: slotFromOrder(0),
      center: slotFromOrder(1),
      right: slotFromOrder(2),
    },
    es: copyFromTranslation(
      page?.translations.find((item) => item.locale === "es-MX"),
    ),
    en: copyFromTranslation(
      page?.translations.find((item) => item.locale === "en-US"),
    ),
    featuredProducts: slots.products.map((item) => ({
      productId: item.id,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    featuredUniverses: slots.universes.map((item) => ({
      universeId: item.id,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    })),
    publishedProducts,
    activeUniverses,
  };
}
