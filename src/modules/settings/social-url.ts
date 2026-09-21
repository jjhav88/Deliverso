const javascriptPattern = /^\s*javascript:/i;

export function isSafeHttpsUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || javascriptPattern.test(trimmed)) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeHttpsUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return isSafeHttpsUrl(trimmed) ? trimmed : null;
}
