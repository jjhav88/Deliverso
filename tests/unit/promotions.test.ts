import { describe, expect, it } from "vitest";
import { adminAuditActions } from "@/modules/auth/domain/audit-actions";
import { adminNavigation } from "@/config/admin-navigation";
import { canAccessAdminPanel, isAdminRole } from "@/modules/auth/domain/admin-role";
import { emptyAdminPromotionState } from "@/modules/promotions/admin-action-state";
import {
  auditActionForPromotionStatus,
  canTransitionPromotionStatus,
  parsePromotionStatusForm,
  promotionStatusUpdateError,
  promotionStatusWriteData,
} from "@/modules/promotions/domain/status-transition";
import { normalizePromotionCode } from "@/modules/promotions/domain/code";
import { percentageDiscountMinor, quotePromotion } from "@/modules/promotions/domain/calculator";
import { evaluatePromotionEligibility } from "@/modules/promotions/domain/eligibility";
import { itemMatchesScope } from "@/modules/promotions/domain/scope";
import { resolveAppliedPromotion, selectAutomaticPromotion } from "@/modules/promotions/domain/selection";
import { buildPromotionTotals, wouldCreateZeroValueOrder } from "@/modules/promotions/domain/totals";
import {
  canAcceptReservation,
  nextReservationStatusOnCancel,
  nextReservationStatusOnPayment,
  reservationCountsTowardLimit,
} from "@/modules/promotions/domain/reservation";
import { derivePromotionDisplayStatus, promotionDisplayLabel } from "@/modules/promotions/domain/display-status";
import { validatePromotionActivation } from "@/modules/promotions/domain/activation";
import { promotionRulePreview } from "@/modules/promotions/domain/preview";
import { publicPromotionUnavailableMessage, type PromotionContext, type PromotionRule } from "@/modules/promotions/domain/types";

const now = new Date("2026-09-21T18:00:00.000Z");

function rule(overrides: Partial<PromotionRule> = {}): PromotionRule {
  return {
    id: "promo-a",
    mode: "CODE",
    status: "ACTIVE",
    normalizedCode: "BIENVENIDA10",
    benefitType: "PERCENTAGE",
    percentageBps: 1000,
    fixedAmountMinor: null,
    minSubtotalMinor: 10000,
    maxDiscountMinor: 10000,
    startsAt: new Date("2026-09-01T00:00:00.000Z"),
    endsAt: new Date("2026-12-01T00:00:00.000Z"),
    usageLimitTotal: 100,
    usageLimitPerCustomer: 1,
    priority: 0,
    scopeType: "ORDER",
    productIds: [],
    categoryIds: [],
    universeIds: [],
    businessLineIds: [],
    label: "Bienvenida 10",
    ...overrides,
  };
}

function context(overrides: Partial<PromotionContext> = {}): PromotionContext {
  return {
    customerId: "cus-1",
    items: [{ productId: "p1", lineTotalMinor: 50000, categoryIds: ["c1"], universeIds: ["u1"], businessLineId: "b1" }],
    subtotalMinor: 50000,
    deliveryFeeMinor: 8000,
    fulfillmentMethod: "DELIVERY",
    now,
    reservedTotal: 0,
    reservedForCustomer: 0,
    ...overrides,
  };
}

describe("code normalization", () => {
  it("trims, uppercases and rejects invalid characters", () => {
    expect(normalizePromotionCode(" bienvenida10 ")).toBe("BIENVENIDA10");
    expect(normalizePromotionCode("bienvenida10")).toBe("BIENVENIDA10");
    expect(normalizePromotionCode("AB")).toBeNull();
    expect(normalizePromotionCode("not valid")).toBeNull();
    expect(publicPromotionUnavailableMessage).toBe("Este código no está disponible.");
  });
});

describe("calculator", () => {
  it("uses basis points and ROUND_HALF_UP", () => {
    expect(percentageDiscountMinor(10000, 1000)).toBe(1000);
    expect(percentageDiscountMinor(15555, 1500)).toBe(2333);
  });

  it("applies percentage, max discount and keeps payable total", () => {
    const quoted = quotePromotion(rule(), context());
    expect(quoted.discountMinor).toBe(5000);
    expect(quoted.totalDiscountMinor).toBe(5000);
    const capped = quotePromotion(rule({ maxDiscountMinor: 1500 }), context());
    expect(capped.discountMinor).toBe(1500);
  });

  it("caps fixed amount to eligible subtotal", () => {
    const quoted = quotePromotion(
      rule({
        benefitType: "FIXED_AMOUNT",
        percentageBps: null,
        fixedAmountMinor: 15000,
        maxDiscountMinor: null,
      }),
      context({
        subtotalMinor: 12000,
        items: [{ productId: "p1", lineTotalMinor: 12000, categoryIds: [], universeIds: [], businessLineId: null }],
      }),
    );
    expect(quoted.discountMinor).toBe(12000);
  });

  it("applies free delivery only for DELIVERY", () => {
    const free = rule({ benefitType: "FREE_DELIVERY", percentageBps: null });
    expect(quotePromotion(free, context()).deliveryDiscountMinor).toBe(8000);
    expect(quotePromotion(free, context({ fulfillmentMethod: "PICKUP" })).deliveryDiscountMinor).toBe(0);
  });
});

describe("eligibility", () => {
  it("rejects paused, archived, scheduled, expired and below minimum", () => {
    expect(evaluatePromotionEligibility(rule({ status: "PAUSED" }), context()).reason).toBe("PAUSED");
    expect(evaluatePromotionEligibility(rule({ status: "ARCHIVED" }), context()).reason).toBe("UNAVAILABLE");
    expect(evaluatePromotionEligibility(rule({ startsAt: new Date("2026-10-01T00:00:00.000Z") }), context()).reason).toBe("SCHEDULED");
    expect(evaluatePromotionEligibility(rule({ endsAt: new Date("2026-09-01T00:00:00.000Z") }), context()).reason).toBe("EXPIRED");
    expect(evaluatePromotionEligibility(rule(), context({ subtotalMinor: 5000 })).reason).toBe("BELOW_MINIMUM");
  });

  it("rejects pickup for free delivery and pending delivery without fake discount", () => {
    const free = rule({ benefitType: "FREE_DELIVERY", percentageBps: null, minSubtotalMinor: null });
    expect(evaluatePromotionEligibility(free, context({ fulfillmentMethod: "PICKUP" })).isEligible).toBe(false);
    const pending = evaluatePromotionEligibility(free, context({ fulfillmentMethod: null }));
    expect(pending.isEligible).toBe(true);
    expect(pending.reason).toBe("DELIVERY_PENDING");
    expect(pending.deliveryDiscountMinor).toBe(0);
  });

  it("honors usage limits and refuses zero-value orders", () => {
    expect(evaluatePromotionEligibility(rule(), context({ reservedTotal: 100 })).reason).toBe("USAGE_LIMIT");
    expect(evaluatePromotionEligibility(rule(), context({ reservedForCustomer: 1 })).reason).toBe("CUSTOMER_LIMIT");
    const zero = evaluatePromotionEligibility(
      rule({
        benefitType: "FIXED_AMOUNT",
        percentageBps: null,
        fixedAmountMinor: 50000,
        minSubtotalMinor: 10000,
        maxDiscountMinor: null,
      }),
      context({ deliveryFeeMinor: 0 }),
    );
    expect(zero.reason).toBe("ZERO_VALUE");
    expect(wouldCreateZeroValueOrder({ subtotalMinor: 1000, deliveryFeeMinor: 0, discountMinor: 1000, deliveryDiscountMinor: 0 })).toBe(true);
  });
});

describe("scopes", () => {
  it("matches product, category, universe and business line with OR semantics", () => {
    const item = { productId: "p1", lineTotalMinor: 20000, categoryIds: ["c1"], universeIds: ["u1"], businessLineId: "b1" };
    expect(itemMatchesScope(item, rule({ scopeType: "ORDER" }))).toBe(true);
    expect(itemMatchesScope(item, rule({ scopeType: "PRODUCT", productIds: ["p1", "p2"] }))).toBe(true);
    expect(itemMatchesScope(item, rule({ scopeType: "PRODUCT", productIds: ["p9"] }))).toBe(false);
    expect(itemMatchesScope(item, rule({ scopeType: "CATEGORY", categoryIds: ["c1"] }))).toBe(true);
    expect(itemMatchesScope(item, rule({ scopeType: "UNIVERSE", universeIds: ["u1"] }))).toBe(true);
    expect(itemMatchesScope(item, rule({ scopeType: "BUSINESS_LINE", businessLineIds: ["b1"] }))).toBe(true);
  });

  it("uses configured line total for product scope", () => {
    const quoted = quotePromotion(
      rule({ scopeType: "PRODUCT", productIds: ["p1"], minSubtotalMinor: null, maxDiscountMinor: null }),
      context({
        items: [
          { productId: "p1", lineTotalMinor: 45000, categoryIds: [], universeIds: [], businessLineId: null },
          { productId: "p2", lineTotalMinor: 20000, categoryIds: [], universeIds: [], businessLineId: null },
        ],
        subtotalMinor: 65000,
      }),
    );
    expect(quoted.eligibleSubtotalMinor).toBe(45000);
    expect(quoted.discountMinor).toBe(4500);
  });
});

describe("selection", () => {
  it("lets an explicit code beat an automatic promotion", () => {
    const code = evaluatePromotionEligibility(rule(), context());
    const automatic = evaluatePromotionEligibility(
      rule({ id: "auto", mode: "AUTOMATIC", normalizedCode: null, percentageBps: 2000, maxDiscountMinor: null }),
      context(),
    );
    const applied = resolveAppliedPromotion({ selectedCodeQuote: code, automaticQuote: automatic });
    expect(applied?.promotionId).toBe("promo-a");
    expect(applied?.totalDiscountMinor).toBeLessThan(automatic.totalDiscountMinor);
  });

  it("picks automatic by discount, then priority, then startsAt, then id", () => {
    const first = evaluatePromotionEligibility(
      rule({ id: "z", mode: "AUTOMATIC", normalizedCode: null, priority: 1, percentageBps: 1000, maxDiscountMinor: null }),
      context(),
    );
    const second = evaluatePromotionEligibility(
      rule({ id: "a", mode: "AUTOMATIC", normalizedCode: null, priority: 5, percentageBps: 1000, maxDiscountMinor: null }),
      context(),
    );
    const chosen = selectAutomaticPromotion({
      quotes: [first, second],
      rules: [
        rule({ id: "z", mode: "AUTOMATIC", normalizedCode: null, priority: 1 }),
        rule({ id: "a", mode: "AUTOMATIC", normalizedCode: null, priority: 5 }),
      ],
    });
    expect(chosen?.promotionId).toBe("a");
  });
});

describe("totals", () => {
  it("never goes negative and subtracts promotion after subtotal + delivery", () => {
    expect(
      buildPromotionTotals({
        subtotalMinor: 50000,
        deliveryFeeMinor: 8000,
        discountMinor: 5000,
        deliveryDiscountMinor: 8000,
      }),
    ).toEqual({
      subtotalMinor: 50000,
      deliveryFeeMinor: 8000,
      promotionDiscountMinor: 13000,
      grandTotalMinor: 45000,
    });
  });
});

describe("reservations", () => {
  it("counts consumed and unexpired reserved toward limits", () => {
    expect(reservationCountsTowardLimit({ status: "CONSUMED", expiresAt: now, now })).toBe(true);
    expect(reservationCountsTowardLimit({ status: "RESERVED", expiresAt: new Date("2026-09-21T19:00:00.000Z"), now })).toBe(true);
    expect(reservationCountsTowardLimit({ status: "RESERVED", expiresAt: new Date("2026-09-21T17:00:00.000Z"), now })).toBe(false);
    expect(reservationCountsTowardLimit({ status: "RELEASED", expiresAt: now, now })).toBe(false);
    expect(canAcceptReservation({ usedCount: 1, limit: 1 })).toBe(false);
    expect(nextReservationStatusOnPayment("RESERVED")).toBe("CONSUMED");
    expect(nextReservationStatusOnPayment("CONSUMED")).toBe("CONSUMED");
    expect(nextReservationStatusOnCancel("RESERVED")).toBe("RELEASED");
    expect(nextReservationStatusOnCancel("CONSUMED")).toBe("CONSUMED");
  });
});

describe("admin validation and display", () => {
  it("validates activation and derived status", () => {
    expect(
      validatePromotionActivation({
        mode: "CODE",
        normalizedCode: "STAGING10",
        labelEs: "Staging",
        benefitType: "PERCENTAGE",
        percentageBps: 1000,
        fixedAmountMinor: null,
        minSubtotalMinor: 10000,
        maxDiscountMinor: 10000,
        startsAt: null,
        endsAt: null,
        usageLimitTotal: 1,
        usageLimitPerCustomer: 1,
        scopeType: "ORDER",
        targetCount: 0,
      }),
    ).toEqual([]);
    expect(
      validatePromotionActivation({
        mode: "CODE",
        normalizedCode: null,
        labelEs: "",
        benefitType: "PERCENTAGE",
        percentageBps: 10000,
        fixedAmountMinor: null,
        minSubtotalMinor: -1,
        maxDiscountMinor: 0,
        startsAt: now,
        endsAt: now,
        usageLimitTotal: 0,
        usageLimitPerCustomer: 0,
        scopeType: "PRODUCT",
        targetCount: 0,
      }),
    ).toEqual([
      "MISSING_ES_LABEL",
      "MISSING_CODE",
      "INVALID_PERCENTAGE",
      "INVALID_MIN_SUBTOTAL",
      "INVALID_MAX_DISCOUNT",
      "INVALID_DATES",
      "INVALID_USAGE_LIMIT",
      "INVALID_USAGE_LIMIT",
      "MISSING_SCOPE_TARGETS",
    ]);
    expect(promotionDisplayLabel(derivePromotionDisplayStatus({ status: "ACTIVE", startsAt: new Date("2026-10-01T00:00:00.000Z"), endsAt: null, now }))).toBe("Programada");
    expect(promotionRulePreview({
      benefitType: "PERCENTAGE",
      percentageBps: 1000,
      fixedAmountMinor: null,
      minSubtotalMinor: 50000,
      maxDiscountMinor: 15000,
      usageLimitPerCustomer: 1,
      scopeType: "PRODUCT",
    })).toContain("10%");
  });

  it("exposes audit actions and a ready promotions module", () => {
    expect(adminAuditActions).toEqual(expect.arrayContaining([
      "PROMOTION_CREATED",
      "PROMOTION_UPDATED",
      "PROMOTION_ACTIVATED",
      "PROMOTION_PAUSED",
      "PROMOTION_ARCHIVED",
    ]));
    expect(adminNavigation.find((item) => item.id === "promotions")).toMatchObject({
      href: "/admin/promotions",
      availability: "ready",
    });
  });
});

describe("admin status transitions", () => {
  it("allows pause, archive and reactivation without touching archived promotions", () => {
    expect(canTransitionPromotionStatus("ACTIVE", "PAUSED")).toBe(true);
    expect(canTransitionPromotionStatus("PAUSED", "ACTIVE")).toBe(true);
    expect(canTransitionPromotionStatus("ACTIVE", "ARCHIVED")).toBe(true);
    expect(canTransitionPromotionStatus("PAUSED", "ARCHIVED")).toBe(true);
    expect(canTransitionPromotionStatus("ARCHIVED", "ACTIVE")).toBe(false);
    expect(canTransitionPromotionStatus("ARCHIVED", "PAUSED")).toBe(false);
  });

  it("maps pause to a single PROMOTION_PAUSED audit action", () => {
    expect(auditActionForPromotionStatus("PAUSED")).toBe("PROMOTION_PAUSED");
    expect(auditActionForPromotionStatus("ARCHIVED")).toBe("PROMOTION_ARCHIVED");
    expect(auditActionForPromotionStatus("ACTIVE")).toBe("PROMOTION_ACTIVATED");
  });

  it("writes only status fields so orders and reservations stay untouched", () => {
    expect(promotionStatusWriteData("PAUSED", "admin-1")).toEqual({
      status: "PAUSED",
      updatedByAdminId: "admin-1",
    });
  });

  it("rejects missing promotionId and unauthorized roles", () => {
    const empty = parsePromotionStatusForm(new FormData());
    expect(empty).toEqual({ ok: false, error: promotionStatusUpdateError });
    const invalid = new FormData();
    invalid.set("status", "PAUSED");
    expect(parsePromotionStatusForm(invalid).ok).toBe(false);
    expect(isAdminRole("EDITOR")).toBe(false);
    expect(canAccessAdminPanel("SUPER_ADMIN")).toBe(true);
    expect(canAccessAdminPanel("ADMIN")).toBe(true);
  });

  it("keeps action state outside the use server module", () => {
    expect(emptyAdminPromotionState).toEqual({ error: null, success: null });
  });

  it("reads promotionId from the status form", () => {
    const formData = new FormData();
    formData.set("promotionId", "93bb58e3-b6a8-4c72-931c-c8d1b624295a");
    formData.set("status", "PAUSED");
    expect(parsePromotionStatusForm(formData)).toEqual({
      ok: true,
      promotionId: "93bb58e3-b6a8-4c72-931c-c8d1b624295a",
      status: "PAUSED",
    });
  });
});
