import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { FeaturedProductsSection } from "@/modules/home/components/featured-products-section";
import { FinalCtaSection } from "@/modules/home/components/final-cta-section";
import { HeroSection } from "@/modules/home/components/hero-section";
import { IntroductionSection } from "@/modules/home/components/introduction-section";
import { PersonalizationSection } from "@/modules/home/components/personalization-section";
import { UniversesSection } from "@/modules/home/components/universes-section";
import { ValuePropositionSection } from "@/modules/home/components/value-proposition-section";
import { getHomeContent } from "@/modules/home/get-home-content";
import { routing } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "home.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const content = await getHomeContent();
  const { visibility } = content;

  return (
    <>
      <HeroSection content={content.hero} />
      {visibility.showIntroduction ? (
        <IntroductionSection content={content.intro} />
      ) : null}
      {visibility.showFeaturedProducts ? (
        <FeaturedProductsSection content={content.featured} />
      ) : null}
      {visibility.showUniverses ? (
        <UniversesSection content={content.universes} />
      ) : null}
      {visibility.showPersonalization ? (
        <PersonalizationSection content={content.personalization} />
      ) : null}
      {visibility.showValueProposition ? (
        <ValuePropositionSection content={content.valueProposition} />
      ) : null}
      {visibility.showFinalCta ? (
        <FinalCtaSection content={content.finalCta} />
      ) : null}
    </>
  );
}
