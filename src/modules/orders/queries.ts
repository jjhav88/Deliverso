import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { expirePendingOrderIfNeeded } from "@/modules/orders/expire";
import { toCustomerOrderDetail, toCustomerOrderSummary } from "@/modules/orders/mappers";
import type { CustomerOrderDetail, CustomerOrderSummary } from "@/modules/orders/dto";

const orderDetailInclude = {
  address: true,
  items: {
    orderBy: { sortOrder: "asc" as const },
    include: { options: { orderBy: { sortOrder: "asc" as const } } },
  },
} as const;

export async function listCustomerOrders(customerId: string): Promise<CustomerOrderSummary[]> {
  if (!hasRuntimeDatabaseUrl()) {
    return [];
  }
  const rows = await getPrisma().order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: orderDetailInclude,
  });
  return rows.map(toCustomerOrderSummary);
}

export async function getCustomerPendingPaymentOrder(customerId: string) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const row = await getPrisma().order.findFirst({
    where: { customerId, status: "PENDING_PAYMENT" },
    orderBy: { createdAt: "desc" },
    include: orderDetailInclude,
  });
  if (!row) {
    return null;
  }
  const expiry = await expirePendingOrderIfNeeded(row.id);
  if (expiry === "expired") {
    return null;
  }
  return row;
}

export async function getCustomerOrderByNumber(input: {
  customerId: string;
  orderNumber: string;
  locale: string;
}): Promise<CustomerOrderDetail | null> {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const row = await getPrisma().order.findFirst({
    where: { orderNumber: input.orderNumber, customerId: input.customerId },
    include: orderDetailInclude,
  });
  if (!row) {
    return null;
  }
  await expirePendingOrderIfNeeded(row.id);
  const fresh = await getPrisma().order.findFirst({
    where: { id: row.id, customerId: input.customerId },
    include: orderDetailInclude,
  });
  return fresh ? toCustomerOrderDetail(fresh, input.locale) : null;
}

export async function getOwnedOrderRecord(input: {
  customerId: string;
  orderNumber: string;
}) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  const row = await getPrisma().order.findFirst({
    where: { orderNumber: input.orderNumber, customerId: input.customerId },
    include: orderDetailInclude,
  });
  if (!row) {
    return null;
  }
  await expirePendingOrderIfNeeded(row.id);
  return getPrisma().order.findFirst({
    where: { id: row.id, customerId: input.customerId },
    include: orderDetailInclude,
  });
}

export async function getOwnedOrderPaymentStatuses(orderNumber: string) {
  if (!hasRuntimeDatabaseUrl()) {
    return null;
  }
  return getPrisma().order.findFirst({
    where: { orderNumber },
    select: {
      customerId: true,
      status: true,
      paymentStatus: true,
    },
  });
}
