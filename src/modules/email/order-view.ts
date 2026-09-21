import "server-only";
import type { OrderEmailView } from "@/modules/email/domain/types";
import { calendarDateFromDb } from "@/modules/checkout/domain/timezone";
import { formatAddressLines } from "@/modules/email/domain/presentation";

type OrderSnapshotRow = {
  orderNumber: string;
  customerName: string;
  locale: string;
  fulfillmentMethod: "DELIVERY" | "PICKUP";
  requestedDate: Date;
  timeWindowLabel: string | null;
  timeWindowStart: string;
  timeWindowEnd: string;
  itemsSubtotalMinor: number;
  deliveryFeeMinor: number;
  grandTotalMinor: number;
  promotionLabelSnapshot?: string | null;
  promotionCodeSnapshot?: string | null;
  promotionDiscountMinor?: number;
  deliveryZoneName: string | null;
  pickupLocationName: string | null;
  pickupAddressSnapshot: string | null;
  displayCurrencyCode: string | null;
  displayTotalMinor: number | null;
  displayExchangeRate: { toString(): string } | null;
  displayExchangeProvider: string | null;
  displayExchangeSourceDate: Date | null;
  address: {
    street: string;
    exteriorNumber: string | null;
    locality: string | null;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  items: Array<{
    quantity: number;
    productNameEs: string;
    productNameEn: string | null;
    variantNameEs: string | null;
    variantNameEn: string | null;
    lineTotalMinor: number;
    configuredUnitPriceMinor: number;
    options: Array<{
      groupNameEs: string;
      groupNameEn: string | null;
      optionNameEs: string;
      optionNameEn: string | null;
    }>;
  }>;
};

function localized(locale: string, es: string, en: string | null): string {
  return locale === "en-US" && en ? en : es;
}

export function toOrderEmailView(row: OrderSnapshotRow): OrderEmailView {
  const locale = row.locale === "en-US" ? "en-US" : "es-MX";
  const addressSummary = row.address
    ? [row.address.street, row.address.exteriorNumber, row.address.city, row.address.state, row.address.postalCode]
        .filter(Boolean)
        .join(", ")
    : row.deliveryZoneName;

  return {
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    locale,
    fulfillmentMethod: row.fulfillmentMethod,
    requestedDate: calendarDateFromDb(row.requestedDate),
    timeWindow: `${row.timeWindowStart}–${row.timeWindowEnd}`,
    itemsSubtotalMinor: row.itemsSubtotalMinor,
    deliveryFeeMinor: row.deliveryFeeMinor,
    grandTotalMinor: row.grandTotalMinor,
    promotionLabel: row.promotionLabelSnapshot ?? null,
    promotionCode: row.promotionCodeSnapshot ?? null,
    promotionDiscountMinor: row.promotionDiscountMinor ?? 0,
    addressSummary,
    addressLines: formatAddressLines({
      street: row.address?.street,
      exteriorNumber: row.address?.exteriorNumber,
      locality: row.address?.locality,
      city: row.address?.city,
      state: row.address?.state,
      postalCode: row.address?.postalCode,
      summary: addressSummary,
    }),
    pickupName: row.pickupLocationName,
    pickupAddress: row.pickupAddressSnapshot,
    displayCurrencyCode: row.displayCurrencyCode,
    displayTotalMinor: row.displayTotalMinor,
    displayExchangeRate: row.displayExchangeRate?.toString() ?? null,
    displayExchangeProvider: row.displayExchangeProvider,
    displayExchangeSourceDate: row.displayExchangeSourceDate
      ? calendarDateFromDb(row.displayExchangeSourceDate)
      : null,
    items: row.items.map((item) => ({
      productName: localized(locale, item.productNameEs, item.productNameEn),
      variantName: item.variantNameEs
        ? localized(locale, item.variantNameEs, item.variantNameEn)
        : null,
      quantity: item.quantity,
      lineTotalMinor: item.lineTotalMinor,
      options: item.options.map((option) => ({
        groupName: localized(locale, option.groupNameEs, option.groupNameEn),
        optionName: localized(locale, option.optionNameEs, option.optionNameEn),
      })),
    })),
  };
}
