import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";

export async function listAdminCustomers() {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }

  return getPrisma().customerAccount.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });
}

export async function getAdminCustomer(id: string) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }

  return getPrisma().customerAccount.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      phone: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      termsAcceptedAt: true,
      privacyAcceptedAt: true,
      carts: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          updatedAt: true,
          _count: { select: { items: true } },
        },
        take: 1,
      },
    },
  });
}
