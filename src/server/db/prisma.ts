import "server-only";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getRuntimeDatabaseUrl } from "@/server/db/env";
import { publicDatabaseError } from "@/server/db/errors";

const globalForPrisma = globalThis as typeof globalThis & {
  deliversoPrisma?: PrismaClient;
  deliversoPgPool?: Pool;
};

function getPgPool(): Pool {
  if (!globalForPrisma.deliversoPgPool) {
    const pool = new Pool({
      connectionString: getRuntimeDatabaseUrl(),
      max: 5,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true,
    });
    pool.on("error", (error) => {
      console.error("DATABASE_POOL_ERROR", publicDatabaseError(error));
    });
    globalForPrisma.deliversoPgPool = pool;
  }
  return globalForPrisma.deliversoPgPool;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(getPgPool(), { disposeExternalPool: false }),
  });
}

function isStalePrismaClient(client: PrismaClient): boolean {
  return (
    typeof client.homeFeaturedUniverse === "undefined" ||
    typeof client.exchangeRateSnapshot === "undefined" ||
    typeof client.cart === "undefined" ||
    typeof client.customerAccount === "undefined" ||
    typeof client.checkoutDraft === "undefined" ||
    typeof client.order === "undefined" ||
    typeof client.emailOutbox === "undefined"
  );
}

/**
 * Lazy singleton. Importing this module does not open a connection.
 * The storefront build stays valid without DATABASE_URL until Prisma is used.
 * After `prisma generate`, a cached client can miss new delegates; recreate it
 * against the same shared Pool so development HMR does not leak connections.
 */
export function getPrisma(): PrismaClient {
  const existing = globalForPrisma.deliversoPrisma;
  if (existing && !isStalePrismaClient(existing)) {
    return existing;
  }

  const client = createPrismaClient();
  globalForPrisma.deliversoPrisma = client;
  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
