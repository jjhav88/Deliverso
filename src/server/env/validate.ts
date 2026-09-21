import { isStripeLiveKey } from "@/config/payments";
import { parseEmailMode, rejectEnabledEmailOutsideProduction } from "@/modules/email/domain/mode";

export type EnvRequirement = "all" | "development" | "production" | "optional";

export type EnvCatalogEntry = {
  name: string;
  category: "APP" | "DATABASE" | "SUPABASE" | "STRIPE" | "EMAIL" | "CRON" | "AUTH" | "FX";
  requirement: EnvRequirement;
  public: boolean;
  notes: string;
};

export const envCatalog: EnvCatalogEntry[] = [
  { name: "NEXT_PUBLIC_APP_URL", category: "APP", requirement: "production", public: true, notes: "Canonical public URL. Required in preview/production." },
  { name: "NODE_ENV", category: "APP", requirement: "all", public: false, notes: "Set by the runtime." },
  { name: "DATABASE_URL", category: "DATABASE", requirement: "all", public: false, notes: "Pooled runtime URL." },
  { name: "DIRECT_URL", category: "DATABASE", requirement: "development", public: false, notes: "Direct URL for Prisma migrate." },
  { name: "SHADOW_DATABASE_URL", category: "DATABASE", requirement: "optional", public: false, notes: "Empty DB for migrate dev only." },
  { name: "NEXT_PUBLIC_SUPABASE_URL", category: "SUPABASE", requirement: "all", public: true, notes: "Auth + Storage host." },
  { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", category: "SUPABASE", requirement: "all", public: true, notes: "Browser-safe publishable key." },
  { name: "SUPABASE_URL", category: "SUPABASE", requirement: "optional", public: false, notes: "Server alias for the public URL." },
  { name: "SUPABASE_SERVICE_ROLE_KEY", category: "SUPABASE", requirement: "optional", public: false, notes: "Admin media/storage only." },
  { name: "AUTH_SECRET", category: "AUTH", requirement: "optional", public: false, notes: "Reserved; unused by current Auth (Supabase)." },
  { name: "STRIPE_SECRET_KEY", category: "STRIPE", requirement: "optional", public: false, notes: "TEST in local/preview. LIVE only after live gate." },
  { name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", category: "STRIPE", requirement: "optional", public: true, notes: "Must match secret mode." },
  { name: "STRIPE_WEBHOOK_SECRET", category: "STRIPE", requirement: "optional", public: false, notes: "Required to accept webhooks." },
  { name: "RESEND_API_KEY", category: "EMAIL", requirement: "optional", public: false, notes: "Needed to dispatch outbox." },
  { name: "EMAIL_MODE", category: "EMAIL", requirement: "optional", public: false, notes: "disabled | sandbox | enabled. enabled only in production." },
  { name: "EMAIL_FROM_NAME", category: "EMAIL", requirement: "optional", public: false, notes: "Defaults to DELIVERSO." },
  { name: "EMAIL_FROM_ADDRESS", category: "EMAIL", requirement: "optional", public: false, notes: "Required if EMAIL_MODE=enabled." },
  { name: "EMAIL_REPLY_TO", category: "EMAIL", requirement: "optional", public: false, notes: "Optional reply address." },
  { name: "EMAIL_SANDBOX_RECIPIENT", category: "EMAIL", requirement: "optional", public: false, notes: "Required if EMAIL_MODE=sandbox." },
  { name: "INTERNAL_CRON_SECRET", category: "CRON", requirement: "optional", public: false, notes: "Bearer for /api/internal/*." },
  { name: "CRON_SECRET", category: "CRON", requirement: "optional", public: false, notes: "Vercel Cron alias; accepted with INTERNAL_CRON_SECRET." },
  { name: "EXCHANGE_RATE_PROVIDER", category: "FX", requirement: "optional", public: false, notes: "Display FX only." },
  { name: "EXCHANGE_RATE_API_BASE", category: "FX", requirement: "optional", public: false, notes: "Frankfurter default." },
  { name: "EXCHANGE_RATE_API_KEY", category: "FX", requirement: "optional", public: false, notes: "Unused by Frankfurter." },
];

export type EnvIssue = {
  name: string;
  reason: string;
};

export type EnvValidationResult = {
  ok: boolean;
  issues: EnvIssue[];
};

export function shouldFailFastEnv(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NEXT_PHASE === "phase-production-build") {
    return false;
  }
  if (env.DELIVERSO_REQUIRE_ENV === "1") {
    return true;
  }
  return env.NODE_ENV === "production" && Boolean(env.VERCEL_ENV);
}

export function validateServerEnv(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const issues: EnvIssue[] = [];
  const nodeEnv = env.NODE_ENV ?? "development";
  const emailMode = parseEmailMode(env.EMAIL_MODE);

  if (rejectEnabledEmailOutsideProduction({ mode: emailMode, nodeEnv })) {
    issues.push({ name: "EMAIL_MODE", reason: "enabled is not allowed outside production" });
  }

  if (isStripeLiveKey(env.STRIPE_SECRET_KEY) && nodeEnv !== "production") {
    issues.push({ name: "STRIPE_SECRET_KEY", reason: "LIVE keys are not allowed outside production" });
  }
  if (isStripeLiveKey(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) && nodeEnv !== "production") {
    issues.push({
      name: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
      reason: "LIVE keys are not allowed outside production",
    });
  }

  if (emailMode === "sandbox" && !env.EMAIL_SANDBOX_RECIPIENT?.trim()) {
    issues.push({ name: "EMAIL_SANDBOX_RECIPIENT", reason: "required when EMAIL_MODE=sandbox" });
  }
  if (emailMode === "enabled" && !env.EMAIL_FROM_ADDRESS?.trim()) {
    issues.push({ name: "EMAIL_FROM_ADDRESS", reason: "required when EMAIL_MODE=enabled" });
  }

  const requiredNow = envCatalog.filter((entry) => {
    if (entry.requirement === "all") {
      return true;
    }
    if (entry.requirement === "production") {
      return nodeEnv === "production" && Boolean(env.VERCEL_ENV);
    }
    return false;
  });

  for (const entry of requiredNow) {
    if (entry.name === "NODE_ENV") {
      continue;
    }
    if (!env[entry.name]?.trim()) {
      issues.push({ name: entry.name, reason: "missing required value" });
    }
  }

  return { ok: issues.length === 0, issues };
}

const alwaysFatal = new Set([
  "EMAIL_MODE",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
]);

export function assertServerEnv(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const result = validateServerEnv(env);
  const fatal = result.issues.filter((issue) => alwaysFatal.has(issue.name));
  const shouldThrow = fatal.length > 0 || (!result.ok && shouldFailFastEnv(env));
  if (shouldThrow) {
    const names = (fatal.length > 0 ? fatal : result.issues)
      .map((issue) => `${issue.name}: ${issue.reason}`)
      .join("; ");
    throw new Error(`ENV_VALIDATION_FAILED: ${names}`);
  }
  return result;
}
