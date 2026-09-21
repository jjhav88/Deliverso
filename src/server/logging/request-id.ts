export function resolveRequestId(request: Request): string {
  const incoming =
    request.headers.get("x-request-id")?.trim() ||
    request.headers.get("x-vercel-id")?.trim();
  return incoming || crypto.randomUUID();
}
