import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { PaymentStatus } from "@/modules/orders/domain/payment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";

export type CustomerOrderSummary = {
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentMethod: FulfillmentMethod;
  requestedDate: string;
  grandTotalMinor: number;
  currencyCode: "MXN";
};

export type CustomerOrderItemOption = {
  groupName: string;
  optionName: string;
  priceDeltaMinor: number;
};

export type CustomerOrderItem = {
  quantity: number;
  productName: string;
  variantName: string | null;
  imageSrc: string | null;
  configuredUnitPriceMinor: number;
  lineTotalMinor: number;
  options: CustomerOrderItemOption[];
};

export type CustomerOrderDetail = CustomerOrderSummary & {
  itemsSubtotalMinor: number;
  deliveryFeeMinor: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerNotes: string | null;
  timeWindowLabel: string | null;
  timeWindowStart: string;
  timeWindowEnd: string;
  deliveryZoneName: string | null;
  pickupLocationName: string | null;
  pickupAddressSnapshot: string | null;
  pickupInstructionsSnapshot: string | null;
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
  items: CustomerOrderItem[];
  displayCurrencyCode: string | null;
  displayTotalMinor: number | null;
  displayExchangeRate: string | null;
  displayExchangeProvider: string | null;
  displayExchangeSourceDate: string | null;
  paidAt: string | null;
  expiresAt: string;
};

export type AdminOrderSummary = {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
  createdAt: string;
  requestedDate: string;
  grandTotalMinor: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  fulfillmentMethod: FulfillmentMethod;
};

export type AdminOrderDetail = CustomerOrderDetail & {
  id: string;
  customerId: string;
  cartId: string;
  stripePaymentIntentId: string | null;
  events: Array<{ type: string; createdAt: string }>;
};
