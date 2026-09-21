const DEFAULT_ADMIN_PATH = "/admin";

export function getSafeAdminPath(next: unknown): string {
  if (typeof next !== "string") {
    return DEFAULT_ADMIN_PATH;
  }

  const path = next.trim();

  if (!path.startsWith("/admin")) {
    return DEFAULT_ADMIN_PATH;
  }

  if (path.startsWith("//") || path.includes("://") || path.includes("\\")) {
    return DEFAULT_ADMIN_PATH;
  }

  if (/[\s<>'"]/.test(path)) {
    return DEFAULT_ADMIN_PATH;
  }

  return path;
}
