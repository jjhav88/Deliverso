import type { Metadata } from "next";
import Image from "next/image";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CatalogBreadcrumbs } from "@/modules/catalog/components/catalog-breadcrumbs";
import { CatalogProductCardView } from "@/modules/catalog/components/catalog-product-card";
import { JsonLd } from "@/modules/catalog/components/json-ld";
import {
  absoluteUrl,
  catalogLanguages,
  localizedPath,
} from "@/modules/catalog/public/canonical";
import { universeDetailHref } from "@/modules/catalog/public/href";
import { buildBreadcrumbJsonLd } from "@/modules/catalog/public/json-ld";
import {
  getActiveUniverseBySlug,
  getPublishedProductsByUniverse,
} from "@/modules/catalog/public/queries";
import { catalogProductDisplayPrice } from "@/modules/catalog/public/display-price";
import { CatalogRateBanner } from "@/modules/catalog/components/catalog-rate-banner";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import "@/modules/catalog/catalog.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return {};
  }

  const result = await getActiveUniverseBySlug(slug, locale);
  if (!result) {
    return {};
  }

  const path = localizedPath(locale, universeDetailHref(result.universe.slug));
  const languages = catalogLanguages(
    result.translations.map((item) => ({
      locale: item.locale,
      path: localizedPath(item.locale, universeDetailHref(item.slug)),
    })),
  );

  return {
    title: result.universe.name,
    description: result.universe.description ?? result.universe.name,
    robots: { index: true, follow: true },
    alternates: {
      canonical: absoluteUrl(path) ?? path,
      languages,
    },
  };
}

export default async function UniverseDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const result = await getActiveUniverseBySlug(slug, locale);
  if (!result) {
    notFound();
  }

  const { universe } = result;
  const t = await getTranslations("universes");
  const catalogT = await getTranslations("catalog");
  const displayCurrency = await getDisplayCurrency();
  const rateSet = await getExchangeRateSet();
  const products = await getPublishedProductsByUniverse({
    locale,
    universeSlug: universe.slug,
  });
  const path = localizedPath(locale, universeDetailHref(universe.slug));
  const url = absoluteUrl(path) ?? path;

  return (
    <Section className="catalog-hero">
      <Container>
        <CatalogBreadcrumbs
          label={t("breadcrumbs")}
          items={[
            { label: t("home"), href: "/" },
            { label: t("list"), href: "/universos" },
            { label: universe.name, current: true },
          ]}
        />
        <JsonLd
          data={buildBreadcrumbJsonLd({
            items: [
              { name: t("home"), url: absoluteUrl(localizedPath(locale, "/")) ?? "/" },
              {
                name: t("list"),
                url: absoluteUrl(localizedPath(locale, "/universos")) ?? "/universos",
              },
              { name: universe.name, url },
            ],
          })}
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="catalog-universe-media max-w-xl">
            {universe.image ? (
              <Image
                src={universe.image.src}
                alt={universe.image.alt}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
          <div>
            <h1 className="type-display-l text-pretty">{universe.name}</h1>
            {universe.description ? (
              <p className="type-body mt-4 max-w-xl text-pretty text-muted-foreground">
                {universe.description}
              </p>
            ) : null}
          </div>
        </div>

        <h2 className="type-h2 mt-16">{t("products")}</h2>
        <CatalogRateBanner
          locale={locale}
          displayCurrency={displayCurrency}
          rateSet={rateSet}
          note={catalogT("fxNote")}
          unavailable={catalogT("fxUnavailable")}
        />
        {products.length === 0 ? (
          <p className="type-body mt-6 text-muted-foreground">{t("emptyProducts")}</p>
        ) : (
          <div className="catalog-grid mt-10">
            {products.map((product) => (
              <CatalogProductCardView
                key={product.id}
                product={product}
                locale={locale}
                displayCurrency={displayCurrency}
                displayPrice={catalogProductDisplayPrice(
                  product,
                  locale,
                  displayCurrency,
                  rateSet,
                )}
                ctaLabel={catalogT("cta")}
                quoteLabel={catalogT("quote")}
                configurableLabel={catalogT("configurable")}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
