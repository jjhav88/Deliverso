import { timingSafeEqual } from "node:crypto";

export function getInternalJobSecrets(): string[] {
  return [process.env.INTERNAL_CRON_SECRET, process.env.CRON_SECRET]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

export function authorizeInternalJob(request: Request): boolean {
  const secrets = getInternalJobSecrets();
  if (secrets.length === 0) {
    return false;
  }
  const header = request.headers.get("authorization") ?? "";
  return secrets.some((secret) => timingSafeBearerEqual(header, secret));
}

export function timingSafeBearerEqual(header: string, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const left = Buffer.from(header);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function unauthorizedInternalResponse(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
