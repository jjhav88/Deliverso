export function excerptForSeo(value: string | null | undefined, max = 160): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }
  if (normalized.length <= max) {
    return normalized;
  }
  const slice = normalized.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

export function isUsefulLocalizedCopy(input: {
  locale: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
}): boolean {
  if (!input.name.trim()) {
    return false;
  }
  if (input.locale === "es-MX") {
    return true;
  }
  return Boolean(input.shortDescription?.trim() || input.description?.trim());
}
