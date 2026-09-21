import { getLocale, getTranslations } from "next-intl/server";
import { HOME_PAGE_ID } from "@/modules/content/singletons";
import { resolveCmsCopy } from "@/modules/home/cms-copy";
import { homeHeroDemo } from "@/modules/home/demo/hero";
import { heroShowcaseDemo } from "@/modules/home/demo/hero-showcase";
import {
  loadHomeFeaturedProducts,
  loadHomeFeaturedUniverses,
} from "@/modules/home/featured-from-catalog";
import { layoutHeroFan } from "@/modules/home/hero-slots";
import { selectHeroShowcaseItems } from "@/modules/home/select-hero-showcase";
import { selectVisibleHeroShowcaseItems } from "@/modules/home/select-hero-showcase";
import type {
  HomePageContent,
  HomeSectionVisibility,
  ValuePropositionItem,
} from "@/modules/home/types/home-content";
import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getPrisma } from "@/server/db/prisma";
import { hasSupabaseAuthConfig } from "@/server/supabase/env";
import type { AppLocale } from "@/config/i18n";

const PERSONALIZATION_STEP_IDS = ["idea", "craft", "receive"] as const;
const VALUE_PROPOSITION_IDS = [
  "creativity",
  "design",
  "flavor",
] as const satisfies readonly ValuePropositionItem["id"][];

const defaultVisibility: HomeSectionVisibility = {
  showIntroduction: true,
  showFeaturedProducts: true,
  showUniverses: true,
  showPersonalization: true,
  showValueProposition: true,
  showFinalCta: true,
};

function pickCopy(configured: string | null | undefined, fallback: string): string {
  return resolveCmsCopy(configured, fallback);
}

export async function getHomeContent(): Promise<HomePageContent> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("home");
  const brandT = await getTranslations("brand");
  const showcaseDemo = selectHeroShowcaseItems(heroShowcaseDemo);

  const i18nContent: HomePageContent = {
    hero: {
      eyebrow: t("hero.eyebrow"),
      title: t("hero.title"),
      tagline: brandT("officialTagline"),
      description: t("hero.description"),
      backgroundImage: homeHeroDemo.backgroundImage,
      tone: homeHeroDemo.tone,
      showcase: showcaseDemo.map((item) => ({
        id: item.id,
        position: item.position,
        imageAlt: "",
      })),
      primaryAction: {
        label: t("hero.primaryCta"),
        href: "/productos",
      },
      secondaryAction: {
        label: t("hero.secondaryCta"),
        href: "/universos",
      },
    },
    intro: {
      heading: t("intro.heading"),
      body: t("intro.body"),
    },
    featured: {
      eyebrow: t("featured.eyebrow"),
      heading: t("featured.heading"),
      intro: t("featured.intro"),
      ctaLabel: t("featured.cta"),
      ctaHref: "/productos",
      products: [],
    },
    universes: {
      eyebrow: t("universes.eyebrow"),
      heading: t("universes.heading"),
      body: t("universes.body"),
      ctaLabel: t("universes.cta"),
      ctaHref: "/universos",
      items: [],
    },
    personalization: {
      heading: t("personalization.heading"),
      body: t("personalization.body"),
      steps: PERSONALIZATION_STEP_IDS.map((id) => ({
        id,
        title: t(`personalization.steps.${id}.title`),
        description: t(`personalization.steps.${id}.description`),
      })),
    },
    valueProposition: {
      heading: t("valueProposition.heading"),
      items: VALUE_PROPOSITION_IDS.map((id) => ({
        id,
        title: t(`valueProposition.items.${id}.title`),
        description: t(`valueProposition.items.${id}.description`),
      })),
    },
    finalCta: {
      heading: t("finalCta.heading"),
      body: t("finalCta.body"),
      ctaLabel: t("finalCta.cta"),
      ctaHref: "/productos",
    },
    visibility: {
      ...defaultVisibility,
      showFeaturedProducts: false,
      showUniverses: false,
    },
  };

  if (!hasRuntimeDatabaseUrl()) {
    return i18nContent;
  }

  try {
    const content = await mergeHomeCmsFromDatabase(i18nContent, locale);
    try {
      const featured = await loadHomeFeaturedProducts({
        locale,
        quoteLabel: t("featured.quoteCta"),
        cardCta: t("featured.cardCta"),
      });
      content.featured.products = featured;
      content.visibility.showFeaturedProducts =
        content.visibility.showFeaturedProducts && featured.length > 0;

      const universes = await loadHomeFeaturedUniverses(locale);
      content.universes.items = universes;
      content.visibility.showUniverses =
        content.visibility.showUniverses && universes.length > 0;
    } catch (error) {
      console.error("[home] Featured catalog unavailable; hiding commercial sections.", error);
      content.featured.products = [];
      content.universes.items = [];
      content.visibility.showFeaturedProducts = false;
      content.visibility.showUniverses = false;
    }
    return content;
  } catch (error) {
    console.error("[home] Failed to load CMS content from the database.", error);
    return i18nContent;
  }
}

async function mergeHomeCmsFromDatabase(
  i18nContent: HomePageContent,
  locale: string,
): Promise<HomePageContent> {
  const prisma = getPrisma();
  const page = await prisma.homePage.findUnique({
    where: { id: HOME_PAGE_ID },
    include: { translations: true },
  });
  const hero = await prisma.homeHero.findFirst({
    orderBy: { createdAt: "asc" },
    include: {
      showcaseItems: {
        include: { mediaAsset: { include: { translations: true } } },
      },
    },
  });

  const translation = page?.translations.find((item) => item.locale === locale);
  const visibility = page
    ? {
        showIntroduction: page.showIntroduction,
        showFeaturedProducts: page.showFeaturedProducts,
        showUniverses: page.showUniverses,
        showPersonalization: page.showPersonalization,
        showValueProposition: page.showValueProposition,
        showFinalCta: page.showFinalCta,
      }
    : defaultVisibility;

  if (page && translation) {
    i18nContent.hero.eyebrow = pickCopy(
      translation.heroEyebrow,
      i18nContent.hero.eyebrow ?? "",
    );
    const headline = resolveCmsCopy(translation.heroHeadline, "");
    i18nContent.hero.headline = headline || undefined;
    i18nContent.hero.description = pickCopy(
      translation.heroDescription,
      i18nContent.hero.description,
    );
    i18nContent.intro.heading = pickCopy(
      translation.introductionTitle,
      i18nContent.intro.heading,
    );
    i18nContent.intro.body = pickCopy(
      translation.introductionBody,
      i18nContent.intro.body,
    );
    i18nContent.featured.eyebrow = pickCopy(
      translation.featuredEyebrow,
      i18nContent.featured.eyebrow,
    );
    i18nContent.featured.heading = pickCopy(
      translation.featuredTitle,
      i18nContent.featured.heading,
    );
    i18nContent.universes.heading = pickCopy(
      translation.universesTitle,
      i18nContent.universes.heading,
    );
    i18nContent.universes.body = pickCopy(
      translation.universesDescription,
      i18nContent.universes.body,
    );
    i18nContent.personalization.heading = pickCopy(
      translation.personalizationTitle,
      i18nContent.personalization.heading,
    );
    i18nContent.personalization.body = pickCopy(
      translation.personalizationDescription,
      i18nContent.personalization.body,
    );
    i18nContent.finalCta.heading = pickCopy(
      translation.finalCtaTitle,
      i18nContent.finalCta.heading,
    );
    i18nContent.finalCta.body = pickCopy(
      translation.finalCtaDescription,
      i18nContent.finalCta.body,
    );
  }

  if (hero?.isActive && hasSupabaseAuthConfig()) {
    const now = new Date();
    const visible = selectVisibleHeroShowcaseItems(hero.showcaseItems, now, 3);
    const slots = [0, 1, 2].map((sortOrder) => {
      const item = visible.find((entry) => entry.sortOrder === sortOrder) ??
        hero.showcaseItems.find((entry) => entry.sortOrder === sortOrder);
      const asset = item?.mediaAsset;
      const alt =
        asset?.translations.find((entry) => entry.locale === locale)?.altText ??
        asset?.translations.find((entry) => entry.altText)?.altText ??
        "";

      return {
        mediaAssetId: asset?.id ?? null,
        publicUrl: asset ? mediaAssetPublicUrl(asset) : undefined,
        alt,
      };
    });

    const fan = layoutHeroFan(slots);
    if (fan.length > 0) {
      i18nContent.hero.showcase = fan;
    }

    if (hero.tone === "DARK") {
      i18nContent.hero.tone = "dark";
    } else if (hero.tone === "LIGHT") {
      i18nContent.hero.tone = "light";
    }
  }

  i18nContent.visibility = visibility;
  return i18nContent;
}
