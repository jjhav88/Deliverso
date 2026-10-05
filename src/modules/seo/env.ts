import { getPublicAppUrl } from "@/config/site";

export const productionPublicOrigin = "https://www.deliverso.com.mx";

export function normalizeOrigin(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/$/, "");
}

export function isWwwDeliversoOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname === "www.deliverso.com.mx";
  } catch {
    return false;
  }
}

/**
 * Indexation depends on deployment environment + configured public origin.
 * Staging/preview/localhost never index, even if APP_URL is mis-set.
 */
export function isSeoIndexableEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") {
    return false;
  }
  const vercelHost = (env.VERCEL_URL ?? "").toLowerCase();
  if (vercelHost.includes("staging") || vercelHost.startsWith("deliverso-staging")) {
    return false;
  }
  const projectProduction = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").toLowerCase();
  if (
    projectProduction &&
    !projectProduction.includes("www.deliverso.com.mx") &&
    !projectProduction.includes("deliverso.com.mx")
  ) {
    return false;
  }
  const origin =
    normalizeOrigin(env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(env.SITE_URL) ??
    getPublicAppUrl();
  if (!isWwwDeliversoOrigin(origin)) {
    return false;
  }
  return env.VERCEL_ENV === "production";
}

/** Canonical origin for indexable production. Staging/local keep configured APP_URL. */
export function canonicalOrigin(env: NodeJS.ProcessEnv = process.env): string | undefined {
  if (isSeoIndexableEnvironment(env)) {
    return productionPublicOrigin;
  }
  return (
    normalizeOrigin(env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(env.SITE_URL) ??
    getPublicAppUrl()
  );
}

export function seoRobots(indexablePage: boolean): { index: boolean; follow: boolean } {
  if (!isSeoIndexableEnvironment() || !indexablePage) {
    return { index: false, follow: false };
  }
  return { index: true, follow: true };
}
