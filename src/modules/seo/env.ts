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

function isStagingVercelHost(env: NodeJS.ProcessEnv): boolean {
  const vercelHost = (env.VERCEL_URL ?? "").toLowerCase();
  const projectProduction = (env.VERCEL_PROJECT_PRODUCTION_URL ?? "").toLowerCase();
  return (
    vercelHost.includes("deliverso-staging") ||
    projectProduction.includes("deliverso-staging")
  );
}

export function isPublicCanonicalHost(host: string | null | undefined): boolean {
  const hostname = host?.split(":")[0]?.toLowerCase();
  return hostname === "www.deliverso.com.mx";
}

/**
 * Indexation depends on the real deployment, not hostname heuristics alone.
 * Vercel production of the main project indexes. Staging/preview/localhost never do.
 */
export function isSeoIndexableEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") {
    return false;
  }
  if (isStagingVercelHost(env)) {
    return false;
  }
  return env.VERCEL_ENV === "production";
}

export function isSeoIndexableRequest(
  host: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!isPublicCanonicalHost(host)) {
    return false;
  }
  if (isStagingVercelHost(env)) {
    return false;
  }
  return env.VERCEL_ENV !== "preview" && env.VERCEL_ENV !== "development";
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
