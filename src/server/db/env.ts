import "server-only";

export class DatabaseEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseEnvError";
  }
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function hasRuntimeDatabaseUrl(): boolean {
  return Boolean(readOptionalEnv("DATABASE_URL"));
}

/**
 * Pooled runtime URL used by Prisma Client.
 * Never read DATABASE_URL ad hoc in pages or modules.
 */
export function getRuntimeDatabaseUrl(): string {
  const url = readOptionalEnv("DATABASE_URL");

  if (!url) {
    throw new DatabaseEnvError(
      "DATABASE_URL is not configured. Prisma can only run on the server after a pooled Postgres URL is set. The public storefront does not require the database.",
    );
  }

  return url;
}

export function getDirectDatabaseUrl(): string | undefined {
  return readOptionalEnv("DIRECT_URL");
}

export function getShadowDatabaseUrl(): string | undefined {
  return readOptionalEnv("SHADOW_DATABASE_URL");
}
