import { describe, expect, it } from "vitest";
import { GET as healthGet } from "@/app/api/health/route";
import { contentSecurityPolicy } from "@/server/security/headers";
import { authorizeInternalJob, timingSafeBearerEqual } from "@/server/security/cron-auth";
import { createLogEntry, sanitizeLogFields } from "@/server/logging/logger";
import {
  assertServerEnv,
  shouldFailFastEnv,
  validateServerEnv,
} from "@/server/env/validate";
import { isStaleProcessing } from "@/modules/email/domain/stale";
import {
  shouldConsiderForReconciliation,
  validatePaymentReconciliation,
} from "@/modules/payments/domain/reconciliation";
import { isDraftExpired } from "@/modules/checkout/domain/status";
import { canTransitionOrderStatus } from "@/modules/orders/domain/status";

describe("health", () => {
  it("returns a public ok payload without secrets", async () => {
    const response = healthGet();
    const body = await response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("deliverso");
    expect(typeof body.timestamp).toBe("string");
    expect(JSON.stringify(body)).not.toMatch(/DATABASE_URL|sk_|whsec_|re_/);
  });
});

describe("env validation", () => {
  it("fails fast on LIVE keys and enabled email outside production", () => {
    const result = validateServerEnv({
      NODE_ENV: "development",
      EMAIL_MODE: "enabled",
      STRIPE_SECRET_KEY: "sk_live_example",
      DATABASE_URL: "postgres://example",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable",
    });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.name)).toEqual(
      expect.arrayContaining(["EMAIL_MODE", "STRIPE_SECRET_KEY"]),
    );
    expect(JSON.stringify(result)).not.toContain("sk_live_example");
  });

  it("does not fail-fast during next build", () => {
    expect(shouldFailFastEnv({ NODE_ENV: "production", NEXT_PHASE: "phase-production-build" })).toBe(
      false,
    );
    expect(() =>
      assertServerEnv({
        NODE_ENV: "production",
        NEXT_PHASE: "phase-production-build",
        EMAIL_MODE: "sandbox",
        EMAIL_SANDBOX_RECIPIENT: "dev@example.com",
      }),
    ).not.toThrow();
    expect(() =>
      assertServerEnv({
        NODE_ENV: "development",
        EMAIL_MODE: "enabled",
      }),
    ).toThrow(/EMAIL_MODE/);
  });
});

describe("internal auth", () => {
  it("rejects missing or wrong bearer with a generic body", () => {
    const previousInternal = process.env.INTERNAL_CRON_SECRET;
    const previousCron = process.env.CRON_SECRET;
    process.env.INTERNAL_CRON_SECRET = "internal-secret";
    delete process.env.CRON_SECRET;
    expect(authorizeInternalJob(new Request("http://localhost/api/internal/maintenance"))).toBe(
      false,
    );
    expect(
      authorizeInternalJob(
        new Request("http://localhost/api/internal/maintenance", {
          headers: { authorization: "Bearer wrong" },
        }),
      ),
    ).toBe(false);
    expect(
      authorizeInternalJob(
        new Request("http://localhost/api/internal/maintenance", {
          headers: { authorization: "Bearer internal-secret" },
        }),
      ),
    ).toBe(true);
    expect(timingSafeBearerEqual("Bearer cron-secret", "cron-secret")).toBe(true);
    if (previousInternal) {
      process.env.INTERNAL_CRON_SECRET = previousInternal;
    } else {
      delete process.env.INTERNAL_CRON_SECRET;
    }
    if (previousCron) {
      process.env.CRON_SECRET = previousCron;
    }
  });
});

describe("logging", () => {
  it("drops secret-like keys and values", () => {
    const sanitized = sanitizeLogFields({
      event: "test",
      STRIPE_SECRET_KEY: "sk_test_xxx",
      email: "ana@example.com",
      client_secret: "pi_secret",
      orderId: "ord_1",
    });
    expect(sanitized).toEqual({ event: "test", orderId: "ord_1" });
    const entry = createLogEntry("info", { event: "STRIPE_WEBHOOK", orderId: "ord_1", result: "processed" });
    expect(JSON.stringify(entry)).not.toMatch(/sk_|whsec_|@example.com/);
  });
});

describe("stale email recovery", () => {
  it("recovers only stale PROCESSING rows", () => {
    const now = new Date("2026-09-21T00:20:00.000Z");
    expect(
      isStaleProcessing({
        status: "PROCESSING",
        processingStartedAt: new Date("2026-09-21T00:05:00.000Z"),
        now,
      }),
    ).toBe(true);
    expect(
      isStaleProcessing({
        status: "PROCESSING",
        processingStartedAt: new Date("2026-09-21T00:15:00.000Z"),
        now,
      }),
    ).toBe(false);
    expect(
      isStaleProcessing({
        status: "SENT",
        processingStartedAt: new Date("2026-09-21T00:00:00.000Z"),
        now,
      }),
    ).toBe(false);
  });
});

describe("payment reconciliation", () => {
  const order = {
    id: "ord_1",
    orderNumber: "DEL-1",
    stripePaymentIntentId: "pi_1",
    grandTotalMinor: 40000,
    status: "PENDING_PAYMENT" as const,
    createdAt: new Date("2026-09-21T00:00:00.000Z"),
  };

  it("applies only a matching succeeded intent", () => {
    expect(
      validatePaymentReconciliation({
        order,
        intent: {
          id: "pi_1",
          status: "succeeded",
          amount: 40000,
          currency: "mxn",
          metadata: { orderId: "ord_1", orderNumber: "DEL-1" },
        },
      }),
    ).toEqual({ ok: true });
  });

  it("rejects amount and metadata mismatches", () => {
    expect(
      validatePaymentReconciliation({
        order,
        intent: {
          id: "pi_1",
          status: "succeeded",
          amount: 100,
          currency: "mxn",
          metadata: { orderId: "ord_1", orderNumber: "DEL-1" },
        },
      }).ok,
    ).toBe(false);
    expect(
      validatePaymentReconciliation({
        order,
        intent: {
          id: "pi_1",
          status: "succeeded",
          amount: 40000,
          currency: "mxn",
          metadata: { orderId: "other", orderNumber: "DEL-1" },
        },
      }),
    ).toEqual({ ok: false, reason: "metadata_mismatch" });
  });

  it("skips recent or already paid orders", () => {
    expect(
      shouldConsiderForReconciliation(
        { ...order, createdAt: new Date("2026-09-21T00:09:00.000Z") },
        new Date("2026-09-21T00:10:00.000Z"),
      ),
    ).toBe(false);
    expect(
      shouldConsiderForReconciliation({ ...order, status: "PAID" }, new Date("2026-09-21T01:00:00.000Z")),
    ).toBe(false);
  });
});

describe("maintenance idempotency", () => {
  it("does not reopen expired drafts or terminal orders", () => {
    expect(isDraftExpired(new Date("2026-09-20T00:00:00.000Z"), new Date("2026-09-21T00:00:00.000Z"))).toBe(
      true,
    );
    expect(canTransitionOrderStatus("EXPIRED", "PENDING_PAYMENT")).toBe(false);
    expect(canTransitionOrderStatus("PAID", "EXPIRED")).toBe(false);
    expect(canTransitionOrderStatus("PENDING_PAYMENT", "EXPIRED")).toBe(true);
  });
});

describe("csp", () => {
  it("allows Stripe Payment Element without a global script wildcard", () => {
    const csp = contentSecurityPolicy("production");
    expect(csp).toContain("https://js.stripe.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("script-src *");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("allows React eval only outside production", () => {
    expect(contentSecurityPolicy("development")).toContain("unsafe-eval");
  });
});
