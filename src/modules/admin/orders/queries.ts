import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { isFulfillmentStatus, type FulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import { isPaymentStatus, type PaymentStatus } from "@/modules/orders/domain/payment-status";
import { isOrderStatus, type OrderStatus } from "@/modules/orders/domain/status";
import { toAdminOrderDetail, toAdminOrderSummary } from "@/modules/orders/mappers";
import type { AdminOrderDetail, AdminOrderSummary } from "@/modules/orders/dto";

export const adminOrdersPageSize = 20;

export type AdminOrderFilters = {
  status?: string | null;
  paymentStatus?: string | null;
  fulfillmentStatus?: string | null;
  q?: string | null;
  from?: string | null;
  to?: string | null;
  page?: string | null;
};

export type AdminOrderListResult = {
  items: AdminOrderSummary[];
  page: number;
  pageCount: number;
  total: number;
};

function parseFilters(input: AdminOrderFilters) {
  const page = Math.max(1, Number.parseInt(input.page ?? "1", 10) || 1);
  const status = input.status && isOrderStatus(input.status) ? (input.status as OrderStatus) : undefined;
  const paymentStatus =
    input.paymentStatus && isPaymentStatus(input.paymentStatus)
      ? (input.paymentStatus as PaymentStatus)
      : undefined;
  const fulfillmentStatus =
    input.fulfillmentStatus && isFulfillmentStatus(input.fulfillmentStatus)
      ? (input.fulfillmentStatus as FulfillmentStatus)
      : undefined;
  const q = input.q?.trim() || undefined;
  const from = input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined;
  const to = input.to ? new Date(`${input.to}T23:59:59.999Z`) : undefined;
  return { page, status, paymentStatus, fulfillmentStatus, q, from, to };
}

export async function listAdminOrders(input: AdminOrderFilters = {}): Promise<AdminOrderListResult> {
  if (!hasRuntimeDatabaseUrl()) {
    return { items: [], page: 1, pageCount: 1, total: 0 };
  }

  const filters = parseFilters(input);
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(filters.fulfillmentStatus ? { fulfillmentStatus: filters.fulfillmentStatus } : {}),
    ...(filters.q
      ? {
          OR: [
            { orderNumber: { contains: filters.q, mode: "insensitive" as const } },
            { customerEmail: { contains: filters.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const prisma = getPrisma();
  const total = await prisma.order.count({ where });
  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (filters.page - 1) * adminOrdersPageSize,
    take: adminOrdersPageSize,
    include: {
      address: true,
      items: { include: { options: true } },
    },
  });

  return {
    items: rows.map(toAdminOrderSummary),
    page: filters.page,
    pageCount: Math.max(1, Math.ceil(total / adminOrdersPageSize)),
    total,
  };
}

export async function getAdminOrderDetail(id: string): Promise<AdminOrderDetail | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const row = await getPrisma().order.findUnique({
    where: { id },
    include: {
      address: true,
      items: {
        orderBy: { sortOrder: "asc" },
        include: { options: { orderBy: { sortOrder: "asc" } } },
      },
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  return row ? toAdminOrderDetail(row) : null;
}
