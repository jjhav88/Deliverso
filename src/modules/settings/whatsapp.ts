const DIGIT_PATTERN = /^\+?[0-9]{8,15}$/;

export function normalizeWhatsappNumber(value: string): string | null {
  const compact = value.replace(/[\s()-]/g, "").trim();
  if (!compact) {
    return null;
  }

  if (!DIGIT_PATTERN.test(compact)) {
    return null;
  }

  return compact.startsWith("+") ? compact : compact;
}

export function whatsappHref(value: string): string | null {
  const normalized = normalizeWhatsappNumber(value);
  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/^\+/, "");
  return `https://wa.me/${digits}`;
}

export function whatsappDisplay(value: string): string {
  return value.trim();
}
