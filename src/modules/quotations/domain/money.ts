export type QuoteOfferMoney = {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
};

export function buildQuoteOfferTotals(input: {
  subtotalMinor: number;
  deliveryFeeMinor: number;
}): QuoteOfferMoney | { ok: false; reason: "ZERO_VALUE" | "NEGATIVE" | "MISMATCH" } {
  if (!Number.isInteger(input.subtotalMinor) || !Number.isInteger(input.deliveryFeeMinor)) {
    return { ok: false, reason: "NEGATIVE" };
  }
  if (input.subtotalMinor <= 0) {
    return { ok: false, reason: "ZERO_VALUE" };
  }
  if (input.deliveryFeeMinor < 0) {
    return { ok: false, reason: "NEGATIVE" };
  }
  return {
    subtotalMinor: input.subtotalMinor,
    deliveryFeeMinor: input.deliveryFeeMinor,
    totalMinor: input.subtotalMinor + input.deliveryFeeMinor,
  };
}

export function isValidQuotedTotal(input: {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
}): boolean {
  const built = buildQuoteOfferTotals(input);
  return !("ok" in built) && built.totalMinor === input.totalMinor && built.totalMinor > 0;
}
