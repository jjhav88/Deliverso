import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const cliDatabaseUrl =
  process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim() || "";
const shadowDatabaseUrl = process.env.SHADOW_DATABASE_URL?.trim();

/**
 * Prisma CLI configuration (format, validate, generate, migrate, studio).
 *
 * Runtime queries do not use this file. The application client reads
 * DATABASE_URL (pooled) from src/server/db/env.ts.
 *
 * CLI prefers DIRECT_URL so migrations talk to Postgres directly,
 * not through a serverless pooler.
 *
 * env() is intentionally avoided: format / validate / generate must work
 * without credentials while Supabase is still pending.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: cliDatabaseUrl,
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
