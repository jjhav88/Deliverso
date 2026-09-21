import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { isAppLocale } from "@/config/i18n";
import { CatalogBreadcrumbs } from "@/modules/catalog/components/catalog-breadcrumbs";
import { CatalogProductCardView } from "@/modules/catalog/components/catalog-product-card";
import { JsonLd } from "@/modules/catalog/components/json-ld";
import { ProductGallery } from "@/modules/catalog/components/product-gallery";
import {
  absoluteUrl,
  catalogLanguages,
  localizedPath,
} from "@/modules/catalog/public/canonical";
import { productDetailHref, universeDetailHref } from "@/modules/catalog/public/href";
import {
  buildBreadcrumbJsonLd,
  buildProductJsonLd,
} from "@/modules/catalog/public/json-ld";
import { formatHumanLeadTime } from "@/modules/catalog/public/lead-time";
import { catalogPricePrefix } from "@/modules/catalog/public/format-price";
import { catalogProductDisplayPrice } from "@/modules/catalog/public/display-price";
import { CatalogFxNote } from "@/modules/catalog/components/catalog-fx-note";
import {
  getPublishedProductBySlug,
  getRelatedProducts,
} from "@/modules/catalog/public/queries";
import { resolveProductSeo } from "@/modules/catalog/public/seo";
import { ProductPurchase } from "@/modules/catalog/components/product-purchase";
import { getPublicConfigurator } from "@/modules/catalog/public/configurator";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import { getQuoteFromSet } from "@/server/exchange-rates/rate-set";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { getPathname } from "@/i18n/navigation";
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

  const result = await getPublishedProductBySlug(slug, locale);
  if (!result) {
    return {};
  }

  const seo = resolveProductSeo(result.product);
  const path = localizedPath(locale, productDetailHref(result.product.slug));
  const languages = catalogLanguages(
    result.translations.map((item) => ({
      locale: item.locale,
      path: localizedPath(item.locale, productDetailHref(item.slug)),
    })),
  );

  return {
    title: seo.title,
    description: seo.description,
    robots: { index: true, follow: true },
    alternates: {
      canonical: absoluteUrl(path) ?? path,
      languages,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: result.product.primaryImage
        ? [{ url: result.product.primaryImage.src, alt: result.product.primaryImage.alt }]
        : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale) || !isAppLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const result = await getPublishedProductBySlug(slug, locale);
  if (!result) {
    notFound();
  }

  const { product } = result;
  const t = await getTranslations("catalog");
  const displayCurrency = await getDisplayCurrency();
  const rateSet = await getExchangeRateSet();
  const related = await getRelatedProducts({
    productId: product.id,
    locale,
    universeSlugs: product.universes.map((item) => item.slug),
    categorySlugs: product.categories.map((item) => item.slug),
  });
  const leadTime = formatHumanLeadTime(product.leadTimeMinutes, locale);
  const groups =
    product.type === "CONFIGURABLE"
      ? await getPublicConfigurator({
          productId: product.id,
          locale,
          displayCurrency,
          rateSet,
        })
      : [];
  const displayPrice = catalogProductDisplayPrice(
    product,
    locale,
    displayCurrency,
    rateSet,
  );
  const formattedPrice = displayPrice?.formatted ?? null;
  const prefix = catalogPricePrefix(product.priceKind, locale);
  const path = localizedPath(locale, productDetailHref(product.slug));
  const url = absoluteUrl(path) ?? path;
  const seo = resolveProductSeo(product);
  const customer = await getOptionalCustomer();
  const signedIn = Boolean(customer && canCustomerShop(customer.status));
  const nextPath = getPathname({
    locale,
    href: { pathname: "/productos/[slug]", params: { slug: product.slug } },
  });

  const ctaNote =
    product.type === "CUSTOM_QUOTE"
      ? t("detail.quoteSoon")
      : t("detail.available");

  return (
    <Section>
      <Container>
        <CatalogBreadcrumbs
          label={t("breadcrumbs")}
          items={[
            { label: t("home"), href: "/" },
            { label: t("products"), href: "/productos" },
            { label: product.name, current: true },
          ]}
        />

        <JsonLd
          data={buildProductJsonLd({
            name: product.name,
            description: seo.description,
            image: product.primaryImage?.src ?? null,
            url,
            type: product.type,
            price: product.price,
          })}
        />
        <JsonLd
          data={buildBreadcrumbJsonLd({
            items: [
              { name: t("home"), url: absoluteUrl(localizedPath(locale, "/")) ?? "/" },
              {
                name: t("products"),
                url: absoluteUrl(localizedPath(locale, "/productos")) ?? "/productos",
              },
              { name: product.name, url },
            ],
          })}
        />

        <div className="catalog-detail mt-10">
          <ProductGallery
            images={product.gallery}
            productName={product.name}
            emptyLabel={t("detail.galleryEmpty")}
          />

          <div>
            <h1 className="type-display-l text-pretty">{product.name}</h1>
            {product.shortDescription ? (
              <p className="type-body mt-4 text-pretty text-muted-foreground">
                {product.shortDescription}
              </p>
            ) : null}
            {product.description ? (
              <div className="mt-6 grid gap-4">
                {product.description.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index} className="type-body text-pretty">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            <p className="type-body mt-8 font-medium tabular-nums">
              {formattedPrice
                ? prefix
                  ? `${prefix} ${formattedPrice}`
                  : formattedPrice
                : t("quotePrice")}
            </p>
            <CatalogFxNote
              locale={locale}
              display={displayPrice}
              detail
              labels={{
                note: t("fxNote"),
                unavailable: t("fxUnavailable"),
                from: t("fxDetailFrom"),
                rate: t("fxDetailRate"),
              }}
            />

            {leadTime ? (
              <p className="type-body-sm mt-3 text-muted-foreground">{leadTime}</p>
            ) : null}

            {product.universes.length > 0 ? (
              <div className="mt-6">
                <p className="type-caption text-muted-foreground">
                  {t("detail.universes")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-3">
                  {product.universes.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={universeDetailHref(item.slug)}
                        className="type-label tracking-[0.12em] text-secondary"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {product.categories.length > 0 ? (
              <div className="mt-5">
                <p className="type-caption text-muted-foreground">
                  {t("detail.categories")}
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {product.categories.map((item) => (
                    <li key={item.slug} className="type-body-sm text-muted-foreground">
                      {item.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {product.type === "CUSTOM_QUOTE" ? (
              <p className="type-body-sm mt-8 max-w-md text-muted-foreground">
                {ctaNote}
              </p>
            ) : (
              <ProductPurchase
                productId={product.id}
                variantId={product.defaultVariantId}
                type={product.type}
                locale={locale}
                displayCurrency={displayCurrency}
                displayRate={getQuoteFromSet(rateSet, displayCurrency)?.rate ?? null}
                baseAmountMinor={product.price?.amountMinor ?? null}
                groups={groups}
                labels={{
                  add: t("detail.addToCart"),
                  quote: t("quotePrice"),
                  quantity: t("detail.quantity"),
                  decrease: t("detail.decrease"),
                  increase: t("detail.increase"),
                  estimated: t("detail.estimated"),
                  required: t("detail.requiredGroup"),
                  selectUpTo: t("detail.selectUpTo"),
                  selectAtLeast: t("detail.selectAtLeast"),
                  added: t("detail.added"),
                  viewCart: t("detail.viewCart"),
                  continue: t("detail.keepShopping"),
                  loginToAdd: t("detail.loginToAdd"),
                }}
                signedIn={signedIn}
                nextPath={nextPath}
              />
            )}
          </div>
        </div>

        {related.length > 0 ? (
          <div className="mt-20">
            <h2 className="type-h2">{t("detail.related")}</h2>
            <div className="catalog-grid mt-10">
              {related.map((item) => (
                <CatalogProductCardView
                  key={item.id}
                  product={item}
                  locale={locale}
                  displayCurrency={displayCurrency}
                  displayPrice={catalogProductDisplayPrice(
                    item,
                    locale,
                    displayCurrency,
                    rateSet,
                  )}
                  ctaLabel={t("cta")}
                  quoteLabel={t("quote")}
                  configurableLabel={t("configurable")}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
