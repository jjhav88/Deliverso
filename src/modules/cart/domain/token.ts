import { createHash, randomBytes } from "node:crypto";

export function generateCartToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashCartToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}
