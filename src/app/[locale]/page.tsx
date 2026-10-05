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
import { isAppLocale } from "@/config/i18n";
import { JsonLd } from "@/modules/catalog/components/json-ld";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/modules/seo/json-ld";
import {
  buildCanonicalUrl,
  buildLocaleAlternates,
  localizedPath,
  publicPageMetadata,
} from "@/modules/seo/urls";
import { getPublicSiteSettings } from "@/modules/settings/queries";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "home.meta" });
  const path = localizedPath(locale, "/");
  return {
    ...(await publicPageMetadata({
      title: t("title"),
      description: t("description"),
      pathname: path,
      locale,
      languages: buildLocaleAlternates("/"),
    })),
    title: { absolute: t("title") },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const content = await getHomeContent();
  const settings = await getPublicSiteSettings();
  const { visibility } = content;
  const origin = buildCanonicalUrl(localizedPath(isAppLocale(locale) ? locale : "es-MX", "/"));
  const sameAs = (settings?.social ?? [])
    .filter((item) => item.isActive && item.url.startsWith("https://"))
    .map((item) => item.url);
  const logoUrl = buildCanonicalUrl("/brand/logos/deliverso-logo-color.png");

  return (
    <>
      <JsonLd
        data={buildOrganizationJsonLd({
          url: origin,
          logoUrl,
          email: settings?.contactEmail,
          telephone: settings?.whatsapp,
          sameAs,
        })}
      />
      <JsonLd data={buildWebSiteJsonLd({ url: origin })} />
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
