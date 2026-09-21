import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { routing } from "@/i18n/routing";
import { Link, getPathname } from "@/i18n/navigation";
import { isAppLocale } from "@/config/i18n";
import { CatalogBreadcrumbs } from "@/modules/catalog/components/catalog-breadcrumbs";
import { CatalogFilters } from "@/modules/catalog/components/catalog-filters";
import { CatalogPagination } from "@/modules/catalog/components/catalog-pagination";
import { CatalogProductCardView } from "@/modules/catalog/components/catalog-product-card";
import { parseCatalogListQuery } from "@/modules/catalog/public/list-query";
import {
  getActiveCategories,
  getActiveUniverses,
  getPublishedProducts,
} from "@/modules/catalog/public/queries";
import {
  absoluteUrl,
  localizedPath,
} from "@/modules/catalog/public/canonical";
import { hasCatalogFilters } from "@/modules/catalog/public/url-state";
import { CatalogRateBanner } from "@/modules/catalog/components/catalog-rate-banner";
import { catalogProductDisplayPrice } from "@/modules/catalog/public/display-price";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import "@/modules/catalog/catalog.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "catalog.meta" });
  const path = localizedPath(locale, "/productos");
  const languages = {
    "es-MX": absoluteUrl(localizedPath("es-MX", "/productos")),
    "en-US": absoluteUrl(localizedPath("en-US", "/productos")),
  };

  return {
    title: t("title"),
    description: t("description"),
    robots: { index: true, follow: true },
    alternates: {
      canonical: absoluteUrl(path) ?? path,
      languages: Object.fromEntries(
        Object.entries(languages).filter(([, url]) => Boolean(url)),
      ),
    },
  };
}

export default async function ProductsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const raw = await searchParams;
  const query = parseCatalogListQuery(locale, raw);
  const t = await getTranslations("catalog");
  const displayCurrency = await getDisplayCurrency();
  const pathname = getPathname({ locale, href: "/productos" });
  const rateSet = await getExchangeRateSet();

  const [result, categories, universes] = await Promise.all([
    getPublishedProducts(query),
    getActiveCategories(locale),
    getActiveUniverses(locale),
  ]);

  const filtered = hasCatalogFilters(query);

  return (
    <Section className="catalog-hero">
      <Container>
        <CatalogBreadcrumbs
          label={t("breadcrumbs")}
          items={[
            { label: t("home"), href: "/" },
            { label: t("products"), current: true },
          ]}
        />
        <p className="type-label mt-8 tracking-[0.2em] text-secondary">
          {t("eyebrow")}
        </p>
        <h1 className="type-display-l mt-3 text-pretty">{t("title")}</h1>
        <p className="type-body mt-4 max-w-xl text-pretty text-muted-foreground">
          {t("intro")}
        </p>
        <CatalogRateBanner
          locale={locale}
          displayCurrency={displayCurrency}
          rateSet={rateSet}
          note={t("fxNote")}
          unavailable={t("fxUnavailable")}
        />

        <div className="mt-10">
          <CatalogFilters
            action={pathname}
            query={query}
            categories={categories}
            universes={universes.map((item) => ({
              slug: item.slug,
              name: item.name,
            }))}
            labels={{
              search: t("search"),
              searchPlaceholder: t("searchPlaceholder"),
              category: t("category"),
              universe: t("universe"),
              type: t("type"),
              sort: t("sort"),
              all: t("all"),
              apply: t("apply"),
              types: {
                STANDARD: t("types.STANDARD"),
                CONFIGURABLE: t("types.CONFIGURABLE"),
                CUSTOM_QUOTE: t("types.CUSTOM_QUOTE"),
              },
              sorts: {
                recommended: t("sorts.recommended"),
                name: t("sorts.name"),
                "price-asc": t("sorts.price-asc"),
                "price-desc": t("sorts.price-desc"),
              },
            }}
          />
        </div>

        {result.items.length === 0 ? (
          <div className="mt-16 max-w-md">
            <p className="type-body text-muted-foreground">
              {filtered ? t("empty") : t("emptyAll")}
            </p>
            {filtered ? (
              <Link
                href="/productos"
                className="mt-6 inline-block type-label tracking-[0.12em] text-secondary"
              >
                {t("seeAll")}
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <div className="catalog-grid mt-6">
              {result.items.map((product, index) => (
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
                  ctaLabel={t("cta")}
                  quoteLabel={t("quote")}
                  configurableLabel={t("configurable")}
                  imagePriority={index === 0}
                />
              ))}
            </div>
            <CatalogPagination
              query={{ ...query, page: result.page }}
              total={result.total}
              previousLabel={t("previous")}
              nextLabel={t("next")}
              pageLabel={t("pagination")}
            />
          </>
        )}
      </Container>
    </Section>
  );
}
