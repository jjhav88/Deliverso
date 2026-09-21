const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

export function normalizePromotionCode(value: string): string | null {
  const normalized = value.trim().toUpperCase();
  if (!CODE_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function isNormalizedPromotionCode(value: string): boolean {
  return CODE_PATTERN.test(value);
}
