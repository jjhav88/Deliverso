const BLOCKING_ISSUES = new Set([
  "PRODUCT_UNAVAILABLE",
  "VARIANT_UNAVAILABLE",
  "OPTION_UNAVAILABLE",
  "INVALID_CONFIGURATION",
  "CUSTOM_QUOTE",
  "QUANTITY_INVALID",
]);

export function cartHasBlockingIssues(
  issues: readonly { code: string }[],
): boolean {
  return issues.some((issue) => BLOCKING_ISSUES.has(issue.code));
}

export function canEnterCheckout(input: {
  itemCount: number;
  items: readonly { valid: boolean }[];
  issues: readonly { code: string }[];
}): boolean {
  return (
    input.itemCount > 0 &&
    input.items.length > 0 &&
    input.items.every((item) => item.valid) &&
    !cartHasBlockingIssues(input.issues)
  );
}

export function canCustomerStartCheckout(status: "ACTIVE" | "BLOCKED" | null | undefined): boolean {
  return status === "ACTIVE";
}
