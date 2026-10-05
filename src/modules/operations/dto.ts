import type { FulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import type { FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import type { PaymentStatus } from "@/modules/orders/domain/payment-status";
import type { OrderStatus } from "@/modules/orders/domain/status";

export const operationsViews = ["today", "tomorrow", "week", "overdue", "all"] as const;
export type OperationsView = (typeof operationsViews)[number];

export const operationsOrderTypes = ["all", "standard", "custom"] as const;
export type OperationsOrderType = (typeof operationsOrderTypes)[number];

export type OperationalOrderItem = {
  quantity: number;
  productName: string;
  variantName: string | null;
  options: Array<{ groupName: string; optionName: string }>;
};

export type OperationalOrderCard = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  customerNotes: string | null;
  requestedDate: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  timeWindowLabel: string | null;
  fulfillmentMethod: FulfillmentMethod;
  fulfillmentStatus: FulfillmentStatus;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customOrder: boolean;
  quotationId: string | null;
  quotationNumberSnapshot: string | null;
  quotationDescriptionSnapshot: string | null;
  promotionLabelSnapshot: string | null;
  promotionCodeSnapshot: string | null;
  refundedAmountMinor: number;
  grandTotalMinor: number;
  deliveryZoneName: string | null;
  pickupLocationName: string | null;
  pickupAddressSnapshot: string | null;
  pickupInstructionsSnapshot: string | null;
  address: {
    street: string;
    exteriorNumber: string | null;
    interiorNumber: string | null;
    locality: string | null;
    city: string;
    state: string;
    postalCode: string;
    reference: string | null;
  } | null;
  items: OperationalOrderItem[];
  overdue: boolean;
  missingSchedule: boolean;
  allowedTransitions: FulfillmentStatus[];
};

export type OperationsMetrics = {
  today: number;
  toPrepare: number;
  inProduction: number;
  ready: number;
  deliveries: number;
  pickups: number;
  overdue: number;
  pendingPayment: number;
  missingSchedule: number;
};

export type OperationsListResult = {
  items: OperationalOrderCard[];
  missingSchedule: OperationalOrderCard[];
  pendingPayment: OperationalOrderCard[];
  page: number;
  pageCount: number;
  total: number;
};
