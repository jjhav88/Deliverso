const FALLBACK = "/cuenta";

const BLOCKED_PREFIXES = ["/admin", "/auth"];

export function getSafeCustomerPath(next: unknown, fallback = FALLBACK): string {
  if (typeof next !== "string") {
    return fallback;
  }

  let path = next.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }

  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://") || path.includes("\\")) {
    return fallback;
  }

  if (/[\s<>'"]/.test(path)) {
    return fallback;
  }

  if (BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return fallback;
  }

  return path;
}

export function withNextQuery(pathname: string, next: string): string {
  const safe = getSafeCustomerPath(next, pathname);
  if (safe === pathname) {
    return pathname;
  }
  return `${pathname}?next=${encodeURIComponent(safe)}`;
}
