import { isNormalizedPromotionCode } from "@/modules/promotions/domain/code";
import type { PromotionBenefitType, PromotionMode, PromotionScopeType } from "@/modules/promotions/domain/types";

export type ActivationIssue =
  | "MISSING_ES_LABEL"
  | "INVALID_PERCENTAGE"
  | "INVALID_FIXED_AMOUNT"
  | "FIXED_BELOW_MINIMUM"
  | "MISSING_CODE"
  | "INVALID_CODE"
  | "INVALID_DATES"
  | "INVALID_USAGE_LIMIT"
  | "MISSING_SCOPE_TARGETS"
  | "INVALID_MIN_SUBTOTAL"
  | "INVALID_MAX_DISCOUNT";

export function validatePromotionActivation(input: {
  mode: PromotionMode;
  normalizedCode: string | null;
  labelEs: string;
  benefitType: PromotionBenefitType;
  percentageBps: number | null;
  fixedAmountMinor: number | null;
  minSubtotalMinor: number | null;
  maxDiscountMinor: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimitTotal: number | null;
  usageLimitPerCustomer: number | null;
  scopeType: PromotionScopeType;
  targetCount: number;
}): ActivationIssue[] {
  const issues: ActivationIssue[] = [];
  if (!input.labelEs.trim()) {
    issues.push("MISSING_ES_LABEL");
  }
  if (input.mode === "CODE") {
    if (!input.normalizedCode) {
      issues.push("MISSING_CODE");
    } else if (!isNormalizedPromotionCode(input.normalizedCode)) {
      issues.push("INVALID_CODE");
    }
  }
  if (input.benefitType === "PERCENTAGE") {
    if (input.percentageBps == null || input.percentageBps <= 0 || input.percentageBps > 9000) {
      issues.push("INVALID_PERCENTAGE");
    }
  }
  if (input.benefitType === "FIXED_AMOUNT") {
    if (input.fixedAmountMinor == null || input.fixedAmountMinor <= 0) {
      issues.push("INVALID_FIXED_AMOUNT");
    } else if (input.minSubtotalMinor == null || input.minSubtotalMinor <= input.fixedAmountMinor) {
      issues.push("FIXED_BELOW_MINIMUM");
    }
  }
  if (input.minSubtotalMinor != null && input.minSubtotalMinor < 0) {
    issues.push("INVALID_MIN_SUBTOTAL");
  }
  if (input.maxDiscountMinor != null && input.maxDiscountMinor <= 0) {
    issues.push("INVALID_MAX_DISCOUNT");
  }
  if (input.startsAt && input.endsAt && input.startsAt.getTime() >= input.endsAt.getTime()) {
    issues.push("INVALID_DATES");
  }
  if (input.usageLimitTotal != null && input.usageLimitTotal <= 0) {
    issues.push("INVALID_USAGE_LIMIT");
  }
  if (input.usageLimitPerCustomer != null && input.usageLimitPerCustomer <= 0) {
    issues.push("INVALID_USAGE_LIMIT");
  }
  if (input.scopeType !== "ORDER" && input.targetCount < 1) {
    issues.push("MISSING_SCOPE_TARGETS");
  }
  return issues;
}
