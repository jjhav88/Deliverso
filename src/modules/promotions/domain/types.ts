export const promotionModes = ["CODE", "AUTOMATIC"] as const;
export type PromotionMode = (typeof promotionModes)[number];

export const promotionBenefitTypes = ["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"] as const;
export type PromotionBenefitType = (typeof promotionBenefitTypes)[number];

export const promotionStatuses = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type PromotionStatus = (typeof promotionStatuses)[number];

export const promotionScopeTypes = [
  "ORDER",
  "PRODUCT",
  "CATEGORY",
  "UNIVERSE",
  "BUSINESS_LINE",
] as const;
export type PromotionScopeType = (typeof promotionScopeTypes)[number];

export const promotionReservationStatuses = ["RESERVED", "CONSUMED", "RELEASED"] as const;
export type PromotionReservationStatus = (typeof promotionReservationStatuses)[number];

export const publicPromotionUnavailableMessage = "Este código no está disponible.";

export type PromotionItem = {
  productId: string;
  lineTotalMinor: number;
  categoryIds: string[];
  universeIds: string[];
  businessLineId: string | null;
};

export type PromotionRule = {
  id: string;
  mode: PromotionMode;
  status: PromotionStatus;
  normalizedCode: string | null;
  benefitType: PromotionBenefitType;
  percentageBps: number | null;
  fixedAmountMinor: number | null;
  minSubtotalMinor: number | null;
  maxDiscountMinor: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  priority: number;
  scopeType: PromotionScopeType;
  productIds: string[];
  categoryIds: string[];
  universeIds: string[];
  businessLineIds: string[];
  label: string;
};

export type PromotionContext = {
  customerId: string;
  cartId?: string | null;
  checkoutDraftId?: string | null;
  items: PromotionItem[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  fulfillmentMethod?: "DELIVERY" | "PICKUP" | null;
  requestedDate?: string | null;
  now: Date;
  reservedTotal: number;
  reservedForCustomer: number;
};

export type PromotionQuote = {
  promotionId: string;
  normalizedCode: string | null;
  label: string;
  benefitType: PromotionBenefitType;
  eligibleSubtotalMinor: number;
  discountMinor: number;
  deliveryDiscountMinor: number;
  totalDiscountMinor: number;
  reason: string | null;
  isEligible: boolean;
};

export type PromotionTotals = {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  promotionDiscountMinor: number;
  grandTotalMinor: number;
};
