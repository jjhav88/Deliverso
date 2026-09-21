import { calendarDateFromDb } from "@/modules/checkout/domain/timezone";
import type {
  AdminOrderDetail,
  AdminOrderSummary,
  CustomerOrderDetail,
  CustomerOrderSummary,
} from "@/modules/orders/dto";
import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { PaymentStatus } from "@/modules/orders/domain/payment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";

type OrderRow = {
  id: string;
  orderNumber: string;
  customerId: string;
  cartId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentMethod: FulfillmentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerNotes: string | null;
  itemsSubtotalMinor: number;
  deliveryFeeMinor: number;
  promotionId?: string | null;
  promotionCodeSnapshot?: string | null;
  promotionLabelSnapshot?: string | null;
  promotionBenefitType?: string | null;
  promotionDiscountMinor?: number;
  promotionEligibleSubtotalMinor?: number | null;
  grandTotalMinor: number;
  requestedDate: Date;
  timeWindowLabel: string | null;
  timeWindowStart: string;
  timeWindowEnd: string;
  deliveryZoneName: string | null;
  pickupLocationName: string | null;
  pickupAddressSnapshot: string | null;
  pickupInstructionsSnapshot: string | null;
  displayCurrencyCode: string | null;
  displayTotalMinor: number | null;
  displayExchangeRate: { toString(): string } | null;
  displayExchangeProvider: string | null;
  displayExchangeSourceDate: Date | null;
  stripePaymentIntentId: string | null;
  paidAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  address: {
    countryCode: string;
    postalCode: string;
    state: string;
    city: string;
    locality: string | null;
    street: string;
    exteriorNumber: string | null;
    interiorNumber: string | null;
    reference: string | null;
  } | null;
  items: Array<{
    quantity: number;
    productNameEs: string;
    productNameEn: string | null;
    variantNameEs: string | null;
    variantNameEn: string | null;
    primaryImageSnapshot: string | null;
    configuredUnitPriceMinor: number;
    lineTotalMinor: number;
    options: Array<{
      groupNameEs: string;
      groupNameEn: string | null;
      optionNameEs: string;
      optionNameEn: string | null;
      priceDeltaMinor: number;
    }>;
  }>;
  events?: Array<{ type: string; createdAt: Date }>;
  promotionReservation?: { status: string } | null;
};

function localizedName(locale: string, es: string, en: string | null): string {
  return locale === "en-US" && en ? en : es;
}

export function toCustomerOrderSummary(row: OrderRow): CustomerOrderSummary {
  return {
    orderNumber: row.orderNumber,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,
    fulfillmentMethod: row.fulfillmentMethod,
    requestedDate: calendarDateFromDb(row.requestedDate),
    grandTotalMinor: row.grandTotalMinor,
    currencyCode: "MXN",
  };
}

export function toCustomerOrderDetail(row: OrderRow, locale: string): CustomerOrderDetail {
  return {
    ...toCustomerOrderSummary(row),
    itemsSubtotalMinor: row.itemsSubtotalMinor,
    deliveryFeeMinor: row.deliveryFeeMinor,
    promotionLabelSnapshot: row.promotionLabelSnapshot ?? null,
    promotionCodeSnapshot: row.promotionCodeSnapshot ?? null,
    promotionDiscountMinor: row.promotionDiscountMinor ?? 0,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerNotes: row.customerNotes,
    timeWindowLabel: row.timeWindowLabel,
    timeWindowStart: row.timeWindowStart,
    timeWindowEnd: row.timeWindowEnd,
    deliveryZoneName: row.deliveryZoneName,
    pickupLocationName: row.pickupLocationName,
    pickupAddressSnapshot: row.pickupAddressSnapshot,
    pickupInstructionsSnapshot: row.pickupInstructionsSnapshot,
    address: row.address,
    items: row.items.map((item) => ({
      quantity: item.quantity,
      productName: localizedName(locale, item.productNameEs, item.productNameEn),
      variantName: localizedName(locale, item.variantNameEs ?? "", item.variantNameEn) || null,
      imageSrc: item.primaryImageSnapshot,
      configuredUnitPriceMinor: item.configuredUnitPriceMinor,
      lineTotalMinor: item.lineTotalMinor,
      options: item.options.map((option) => ({
        groupName: localizedName(locale, option.groupNameEs, option.groupNameEn),
        optionName: localizedName(locale, option.optionNameEs, option.optionNameEn),
        priceDeltaMinor: option.priceDeltaMinor,
      })),
    })),
    displayCurrencyCode: row.displayCurrencyCode,
    displayTotalMinor: row.displayTotalMinor,
    displayExchangeRate: row.displayExchangeRate?.toString() ?? null,
    displayExchangeProvider: row.displayExchangeProvider,
    displayExchangeSourceDate: row.displayExchangeSourceDate
      ? calendarDateFromDb(row.displayExchangeSourceDate)
      : null,
    paidAt: row.paidAt?.toISOString() ?? null,
    expiresAt: row.expiresAt.toISOString(),
  };
}

export function toAdminOrderSummary(row: OrderRow): AdminOrderSummary {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerEmail: row.customerEmail,
    customerName: row.customerName,
    createdAt: row.createdAt.toISOString(),
    requestedDate: calendarDateFromDb(row.requestedDate),
    grandTotalMinor: row.grandTotalMinor,
    status: row.status,
    paymentStatus: row.paymentStatus,
    fulfillmentStatus: row.fulfillmentStatus,
    fulfillmentMethod: row.fulfillmentMethod,
  };
}

export function toAdminOrderDetail(row: OrderRow, locale = "es-MX"): AdminOrderDetail {
  return {
    ...toCustomerOrderDetail(row, locale),
    id: row.id,
    customerId: row.customerId,
    cartId: row.cartId,
    stripePaymentIntentId: row.stripePaymentIntentId,
    events: (row.events ?? []).map((event) => ({
      type: event.type,
      createdAt: event.createdAt.toISOString(),
    })),
    promotionId: row.promotionId ?? null,
    promotionBenefitType: row.promotionBenefitType ?? null,
    promotionEligibleSubtotalMinor: row.promotionEligibleSubtotalMinor ?? null,
    promotionReservationStatus: row.promotionReservation?.status ?? null,
  };
}
