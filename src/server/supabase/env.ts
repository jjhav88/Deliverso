import "server-only";

export class SupabaseEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseEnvError";
  }
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getSupabaseUrl(): string {
  const url =
    readOptionalEnv("NEXT_PUBLIC_SUPABASE_URL") ??
    readOptionalEnv("SUPABASE_URL");

  if (!url) {
    throw new SupabaseEnvError(
      "Supabase URL is not configured. Set NEXT_PUBLIC_SUPABASE_URL.",
    );
  }

  return url;
}

export function getSupabasePublishableKey(): string {
  const key = readOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!key) {
    throw new SupabaseEnvError(
      "Supabase publishable key is not configured. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return key;
}

export function getSupabaseServiceRoleKey(): string {
  const key = readOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!key) {
    throw new SupabaseEnvError(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. This key is server-only.",
    );
  }

  return key;
}

export function hasSupabaseAuthConfig(): boolean {
  try {
    getSupabaseUrl();
    getSupabasePublishableKey();
    return true;
  } catch {
    return false;
  }
}
