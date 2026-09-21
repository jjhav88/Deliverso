import "server-only";
import type { AppLocale } from "@/config/i18n";
import type { CurrencyCode } from "@/config/currency";
import type { DisplayMoney } from "@/lib/money/display";
import { toDisplayMoney } from "@/lib/money/to-display";
import { mediaAssetPublicUrl } from "@/modules/media/server-url";
import { priceConfiguredProduct } from "@/modules/catalog/pricing/price-configured-product";
import type { PricingSnapshot } from "@/modules/catalog/pricing/types";
import type { CartIssue, CartItemView, CartView } from "@/modules/cart/types";
import { findCustomerShopperCart, getCurrentCartRecord } from "@/server/cart/session";
import { getOptionalCustomer } from "@/modules/customer-auth/queries";
import { canCustomerShop } from "@/modules/customer-auth/domain/status";
import { sumCartItemQuantities } from "@/modules/cart/domain/session-read";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { getQuoteFromSet, type ExchangeRateSet } from "@/server/exchange-rates/rate-set";

const emptySubtotal = { amountMinor: 0, currency: "MXN" as const };

export function emptyCartView(
  locale: AppLocale,
  displayCurrency: CurrencyCode,
  rateSet: ExchangeRateSet,
): CartView {
  return {
    items: [],
    itemCount: 0,
    subtotal: emptySubtotal,
    displaySubtotal: toDisplayOrIdentity(emptySubtotal, locale, displayCurrency, rateSet),
    issues: [],
  };
}

export async function getCartItemCount(): Promise<number> {
  if (!hasRuntimeDatabaseUrl()) {
    return 0;
  }

  const customer = await getOptionalCustomer();
  if (!customer || !canCustomerShop(customer.status)) {
    return 0;
  }

  const cart = await findCustomerShopperCart(customer.id);
  if (!cart) {
    return 0;
  }

  const items = await getPrisma().cartItem.findMany({
    where: { cartId: cart.id },
    select: { quantity: true },
  });
  return sumCartItemQuantities(items);
}

export async function getCartView(input: {
  locale: AppLocale;
  displayCurrency: CurrencyCode;
  rateSet: ExchangeRateSet;
}): Promise<CartView> {
  if (!hasRuntimeDatabaseUrl()) {
    return emptyCartView(input.locale, input.displayCurrency, input.rateSet);
  }

  const cart = await getCurrentCartRecord();
  if (!cart) {
    return emptyCartView(input.locale, input.displayCurrency, input.rateSet);
  }

  const rows = await getPrisma().cartItem.findMany({
    where: { cartId: cart.id },
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: {
          id: true,
          type: true,
          status: true,
          translations: {
            select: { locale: true, name: true, slug: true },
          },
          optionGroups: {
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              selectionType: true,
              isRequired: true,
              minSelections: true,
              maxSelections: true,
              isActive: true,
              translations: { select: { locale: true, name: true } },
              options: {
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  isActive: true,
                  priceDeltaMinor: true,
                  translations: { select: { locale: true, name: true } },
                },
              },
            },
          },
          media: {
            where: { role: "PRIMARY" },
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: {
              mediaAsset: {
                select: {
                  bucket: true,
                  objectPath: true,
                  translations: { select: { locale: true, altText: true } },
                },
              },
            },
          },
        },
      },
      variant: {
        select: { id: true, isActive: true, priceMinor: true },
      },
      options: { select: { optionId: true } },
    },
  });

  const items: CartItemView[] = rows.map((row) => {
    const snapshot: PricingSnapshot = {
      productId: row.product.id,
      type: row.product.type,
      status: row.product.status,
      variant: row.variant,
      groups: row.product.optionGroups.map((group) => ({
        id: group.id,
        selectionType: group.selectionType,
        isRequired: group.isRequired,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        isActive: group.isActive,
        options: group.options.map((option) => ({
          id: option.id,
          isActive: option.isActive,
          priceDeltaMinor: option.priceDeltaMinor,
        })),
      })),
    };

    const selectedOptionIds = row.options.map((item) => item.optionId);
    const priced = priceConfiguredProduct({
      snapshot,
      selectedOptionIds,
      quantity: row.quantity,
    });

    const translation =
      row.product.translations.find((item) => item.locale === input.locale) ??
      row.product.translations[0];
    const primary = row.product.media[0]?.mediaAsset;
    const alt =
      primary?.translations.find((item) => item.locale === input.locale)?.altText ??
      translation?.name ??
      "Producto";

    const issues: CartIssue[] = priced.ok
      ? []
      : [{ code: priced.issue, message: priced.message }];

    const unitPrice = priced.ok
      ? { amountMinor: priced.configuredUnitPriceMinor, currency: "MXN" as const }
      : null;
    const lineTotal = priced.ok
      ? { amountMinor: priced.lineTotalMinor, currency: "MXN" as const }
      : null;

    return {
      id: row.id,
      productId: row.product.id,
      slug: translation?.slug ?? "",
      name: translation?.name ?? "Producto",
      imageSrc: primary ? mediaAssetPublicUrl(primary) : null,
      imageAlt: alt,
      quantity: row.quantity,
      configuration: row.product.optionGroups.flatMap((group) => {
        const names = group.options
          .filter((option) => selectedOptionIds.includes(option.id))
          .map(
            (option) =>
              option.translations.find((item) => item.locale === input.locale)?.name ??
              option.translations[0]?.name ??
              option.id,
          );
        if (names.length === 0) {
          return [];
        }
        return [
          {
            groupName:
              group.translations.find((item) => item.locale === input.locale)?.name ??
              group.translations[0]?.name ??
              group.id,
            optionNames: names,
          },
        ];
      }),
      unitPrice,
      lineTotal,
      displayUnitPrice: unitPrice
        ? toDisplayOrIdentity(unitPrice, input.locale, input.displayCurrency, input.rateSet)
        : null,
      displayLineTotal: lineTotal
        ? toDisplayOrIdentity(lineTotal, input.locale, input.displayCurrency, input.rateSet)
        : null,
      valid: priced.ok,
      issues,
    };
  });

  const subtotalMinor = items
    .filter((item) => item.valid && item.lineTotal)
    .reduce((sum, item) => sum + (item.lineTotal?.amountMinor ?? 0), 0);
  const subtotal = { amountMinor: subtotalMinor, currency: "MXN" as const };

  return {
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    displaySubtotal: toDisplayOrIdentity(
      subtotal,
      input.locale,
      input.displayCurrency,
      input.rateSet,
    ),
    issues: items.flatMap((item) => item.issues),
  };
}

function toDisplayOrIdentity(
  amount: { amountMinor: number; currency: "MXN" },
  locale: AppLocale,
  displayCurrency: CurrencyCode,
  rateSet: ExchangeRateSet,
): DisplayMoney {
  return toDisplayMoney({
    amount,
    locale,
    displayCurrency,
    rate: getQuoteFromSet(rateSet, displayCurrency),
  });
}

