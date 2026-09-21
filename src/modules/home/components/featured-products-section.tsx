import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ProductCard } from "@/components/ui/product-card";
import { Link } from "@/i18n/navigation";
import { FeaturedProductMedia } from "@/modules/home/components/featured-product-media";
import type { FeaturedProductsContent } from "@/modules/home/types/home-content";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/config/i18n";
import { isAppLocale } from "@/config/i18n";
import { CatalogRateBanner } from "@/modules/catalog/components/catalog-rate-banner";
import { getDisplayCurrency } from "@/server/preferences/currency";
import { getExchangeRateSet } from "@/server/exchange-rates/service";
import { getQuoteFromSet } from "@/server/exchange-rates/rate-set";
import { toDisplayMoney } from "@/lib/money/to-display";
import { getTranslations } from "next-intl/server";
import "@/modules/home/home.css";

type FeaturedProductsSectionProps = {
  content: FeaturedProductsContent;
};

export async function FeaturedProductsSection({
  content,
}: FeaturedProductsSectionProps) {
  const localeValue = await getLocale();
  const locale: AppLocale = isAppLocale(localeValue) ? localeValue : "es-MX";
  const displayCurrency = await getDisplayCurrency();
  const rateSet = await getExchangeRateSet();
  const catalogT = await getTranslations("catalog");
  return (
    <Section className="home-section-wash">
      <Container>
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div className="max-w-xl">
            <p className="type-label tracking-[0.2em] text-secondary">
              {content.eyebrow}
            </p>
            <h2 className="type-display-l mt-3 text-pretty">{content.heading}</h2>
            <p className="type-body mt-4 max-w-md text-pretty text-muted-foreground">
              {content.intro}
            </p>
            <CatalogRateBanner
              locale={locale}
              displayCurrency={displayCurrency}
              rateSet={rateSet}
              note={catalogT("fxNote")}
              unavailable={catalogT("fxUnavailable")}
            />
          </div>
          <Link href={content.ctaHref} className="home-text-cta text-foreground">
            {content.ctaLabel}
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {content.products.map((product) => (
            <ProductCard
              key={product.id}
              variant="editorial"
              name={product.name}
              description={product.description}
              ctaLabel={product.ctaLabel}
              ctaHref={product.href}
              imageSrc={product.imageSrc}
              imageAlt={product.imageAlt ?? ""}
              locale={locale}
              formattedPrice={
                product.price
                  ? toDisplayMoney({
                      amount: product.price,
                      locale,
                      displayCurrency,
                      rate: getQuoteFromSet(rateSet, displayCurrency),
                    }).formatted
                  : null
              }
              media={
                product.imageSrc ? undefined : product.tone ? (
                  <FeaturedProductMedia tone={product.tone} />
                ) : undefined
              }
            />
          ))}
        </div>
      </Container>
    </Section>
  );
}
