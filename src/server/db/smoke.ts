import "server-only";
import { getPrisma } from "@/server/db/prisma";

/**
 * Connectivity check. Does not insert catalog or Home data.
 */
export async function smokeDatabase(): Promise<true> {
  const rows = await getPrisma().$queryRaw<Array<{ ok: number }>>`
    SELECT 1 AS ok
  `;

  if (rows[0]?.ok !== 1) {
    throw new Error("Database smoke test did not return 1.");
  }

  return true;
}
