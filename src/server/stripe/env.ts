import "server-only";
import { isStripeLiveKey } from "@/config/payments";

export class StripeEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StripeEnvError";
  }
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function rejectLiveInDevelopment(name: string, value: string): void {
  if (process.env.NODE_ENV !== "production" && isStripeLiveKey(value)) {
    throw new StripeEnvError(
      `${name} looks like a Stripe LIVE key. Development only accepts TEST keys.`,
    );
  }
}

export function getStripeSecretKey(): string {
  const key = readOptionalEnv("STRIPE_SECRET_KEY");
  if (!key) {
    throw new StripeEnvError("STRIPE_SECRET_KEY is not configured. Use a Stripe TEST secret key.");
  }
  rejectLiveInDevelopment("STRIPE_SECRET_KEY", key);
  return key;
}

export function getStripePublishableKey(): string {
  const key = readOptionalEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  if (!key) {
    throw new StripeEnvError(
      "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured. Use a Stripe TEST publishable key.",
    );
  }
  rejectLiveInDevelopment("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", key);
  return key;
}

export function getStripeWebhookSecret(): string {
  const secret = readOptionalEnv("STRIPE_WEBHOOK_SECRET");
  if (!secret) {
    throw new StripeEnvError("STRIPE_WEBHOOK_SECRET is not configured.");
  }
  return secret;
}

export function hasStripeConfig(): boolean {
  try {
    getStripeSecretKey();
    getStripePublishableKey();
    return true;
  } catch {
    return false;
  }
}

export function isStripeTestMode(): boolean {
  const secret = readOptionalEnv("STRIPE_SECRET_KEY") ?? "";
  return secret.startsWith("sk_test_");
}

export function shouldShowStripeTestBadge(): boolean {
  return process.env.NODE_ENV !== "production" && isStripeTestMode();
}
