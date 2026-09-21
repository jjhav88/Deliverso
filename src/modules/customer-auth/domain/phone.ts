const PHONE_PATTERN = /^[\d+\s().-]*$/;

export function normalizePhone(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidPhone(value: string): boolean {
  const normalized = normalizePhone(value);
  return normalized.length > 0 && normalized.length <= 32 && PHONE_PATTERN.test(normalized);
}
