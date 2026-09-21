import { ProductCard } from "@/components/ui/product-card";
import type { AppLocale } from "@/config/i18n";
import type { CurrencyCode } from "@/config/currency";
import { productDetailHref } from "@/modules/catalog/public/href";
import type { DisplayMoney } from "@/lib/money/display";
import { catalogPricePrefix } from "@/modules/catalog/public/format-price";
import type { CatalogProductCard } from "@/modules/catalog/public/types";

type CatalogProductCardViewProps = {
  product: CatalogProductCard;
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  displayPrice?: DisplayMoney | null;
  ctaLabel: string;
  quoteLabel: string;
  configurableLabel: string;
  imagePriority?: boolean;
};

export function CatalogProductCardView({
  product,
  locale,
  displayPrice,
  ctaLabel,
  quoteLabel,
  configurableLabel,
  imagePriority = false,
}: CatalogProductCardViewProps) {
  const priceLabel =
    product.priceKind === "quote" ? quoteLabel : undefined;
  const formattedPrice =
    displayPrice && product.priceKind !== "quote"
      ? displayPrice.formatted
      : null;
  const prefix = catalogPricePrefix(product.priceKind, locale);

  return (
    <ProductCard
      variant="editorial"
      name={product.name}
      description={product.shortDescription ?? undefined}
      ctaLabel={ctaLabel}
      ctaHref={productDetailHref(product.slug)}
      imageSrc={product.primaryImage?.src}
      imageAlt={product.primaryImage?.alt ?? product.name}
      imagePriority={imagePriority}
      locale={locale}
      formattedPrice={
        formattedPrice && prefix
          ? `${prefix} ${formattedPrice}`
          : formattedPrice
      }
      priceLabel={priceLabel}
      badge={
        product.type === "CONFIGURABLE"
          ? { label: configurableLabel, variant: "secondary" }
          : undefined
      }
    />
  );
}
