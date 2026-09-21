import type { ProductType } from "@/modules/catalog/domain";
import type { MoneyAmount } from "@/lib/money";
import { minorUnitsToMajor } from "@/lib/money";

export function shouldExposeProductOffer(
  type: ProductType,
  price: MoneyAmount | null,
): price is MoneyAmount {
  return type === "STANDARD" && price !== null;
}

export function buildProductJsonLd(input: {
  name: string;
  description: string | null;
  image: string | null;
  url: string;
  type: ProductType;
  price: MoneyAmount | null;
}): Record<string, unknown> {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    brand: {
      "@type": "Brand",
      name: "DELIVERSO",
    },
  };

  if (input.description) {
    jsonLd.description = input.description;
  }

  if (input.image) {
    jsonLd.image = [input.image];
  }

  if (shouldExposeProductOffer(input.type, input.price)) {
    jsonLd.offers = {
      "@type": "Offer",
      url: input.url,
      priceCurrency: input.price.currency,
      price: minorUnitsToMajor(
        input.price.amountMinor,
        input.price.currency,
      ).toFixed(2),
    };
  }

  return jsonLd;
}

export function buildBreadcrumbJsonLd(input: {
  items: Array<{ name: string; url: string }>;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
