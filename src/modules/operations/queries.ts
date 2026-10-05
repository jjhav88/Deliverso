import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db/prisma";
import { hasRuntimeDatabaseUrl } from "@/server/db/env";
import { isFulfillmentMethod } from "@/modules/checkout/domain/fulfillment";
import { isFulfillmentStatus } from "@/modules/orders/domain/fulfillment-status";
import {
  calendarDateToDb,
  compareOperationalSchedule,
  getBusinessDayRange,
  isMissingOperationalSchedule,
  isOrderOperationallyOverdue,
  normalizeCalendarDate,
} from "@/modules/operations/domain/dates";
import { getAllowedFulfillmentTransitions } from "@/modules/operations/domain/transitions";
import { isOperationalOrder } from "@/modules/operations/domain/eligibility";
import type {
  OperationalOrderCard,
  OperationsListResult,
  OperationsMetrics,
  OperationsOrderType,
  OperationsView,
} from "@/modules/operations/dto";
import { operationsOrderTypes, operationsViews } from "@/modules/operations/dto";

export const operationsPageSize = 30;
export const operationsAgendaLimit = 80;

export type OperationsFilters = {
  view?: string | null;
  method?: string | null;
  fulfillmentStatus?: string | null;
  type?: string | null;
  q?: string | null;
  page?: string | null;
};

const operationalWhere = {
  status: "PAID" as const,
  paymentStatus: "SUCCEEDED" as const,
  fulfillmentStatus: { not: "CANCELLED" as const },
};

const activeOperationalWhere = {
  ...operationalWhere,
  fulfillmentStatus: { notIn: ["CANCELLED" as const, "COMPLETED" as const] },
};

type OperationsOrderRow = Prisma.OrderGetPayload<{
  include: {
    address: true;
    items: { include: { options: true } };
  };
}>;

function parseView(value: string | null | undefined): OperationsView {
  return operationsViews.includes(value as OperationsView) ? (value as OperationsView) : "today";
}

function parseType(value: string | null | undefined): OperationsOrderType | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  return operationsOrderTypes.includes(value as OperationsOrderType)
    ? (value as OperationsOrderType)
    : undefined;
}

function searchWhere(q: string): Prisma.OrderWhereInput {
  return {
    OR: [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
      { customerEmail: { contains: q, mode: "insensitive" } },
      {
        items: {
          some: {
            OR: [
              { productNameEs: { contains: q, mode: "insensitive" } },
              { productNameEn: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ],
  };
}

function dateWhere(view: OperationsView, now: Date): Prisma.OrderWhereInput | undefined {
  const range = getBusinessDayRange(now);
  if (view === "today") {
    return { requestedDate: calendarDateToDb(range.today) };
  }
  if (view === "tomorrow") {
    return { requestedDate: calendarDateToDb(range.tomorrow) };
  }
  if (view === "week") {
    return {
      requestedDate: {
        gte: calendarDateToDb(range.nextSevenStart),
        lte: calendarDateToDb(range.nextSevenEnd),
      },
    };
  }
  if (view === "overdue") {
    return {
      requestedDate: { lte: calendarDateToDb(range.today) },
      fulfillmentStatus: { notIn: ["CANCELLED", "COMPLETED"] },
    };
  }
  return undefined;
}

function toCard(row: OperationsOrderRow, now: Date): OperationalOrderCard {
  const requestedDate = normalizeCalendarDate(row.requestedDate) ?? "";
  const missingSchedule = isMissingOperationalSchedule({
    requestedDate: row.requestedDate,
    timeWindowStart: row.timeWindowStart,
    timeWindowEnd: row.timeWindowEnd,
  });
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    customerNotes: row.customerNotes,
    requestedDate,
    timeWindowStart: row.timeWindowStart,
    timeWindowEnd: row.timeWindowEnd,
    timeWindowLabel: row.timeWindowLabel,
    fulfillmentMethod: row.fulfillmentMethod,
    fulfillmentStatus: row.fulfillmentStatus,
    status: row.status,
    paymentStatus: row.paymentStatus,
    customOrder: row.customOrder,
    quotationId: row.quotationId,
    quotationNumberSnapshot: row.quotationNumberSnapshot,
    quotationDescriptionSnapshot: row.quotationDescriptionSnapshot,
    promotionLabelSnapshot: row.promotionLabelSnapshot,
    promotionCodeSnapshot: row.promotionCodeSnapshot,
    refundedAmountMinor: row.refundedAmountMinor,
    grandTotalMinor: row.grandTotalMinor,
    deliveryZoneName: row.deliveryZoneName,
    pickupLocationName: row.pickupLocationName,
    pickupAddressSnapshot: row.pickupAddressSnapshot,
    pickupInstructionsSnapshot: row.pickupInstructionsSnapshot,
    address: row.address
      ? {
          street: row.address.street,
          exteriorNumber: row.address.exteriorNumber,
          interiorNumber: row.address.interiorNumber,
          locality: row.address.locality,
          city: row.address.city,
          state: row.address.state,
          postalCode: row.address.postalCode,
          reference: row.address.reference,
        }
      : null,
    items: row.items
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        quantity: item.quantity,
        productName: item.productNameEs,
        variantName: item.variantNameEs,
        options: item.options
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((option) => ({
            groupName: option.groupNameEs,
            optionName: option.optionNameEs,
          })),
      })),
    overdue:
      isOperationalOrder(row) &&
      isOrderOperationallyOverdue({
        requestedDate: row.requestedDate,
        timeWindowStart: row.timeWindowStart,
        timeWindowEnd: row.timeWindowEnd,
        fulfillmentStatus: row.fulfillmentStatus,
        orderStatus: row.status,
        now,
      }),
    missingSchedule,
    allowedTransitions: getAllowedFulfillmentTransitions(row),
  };
}

function listInclude() {
  return {
    address: true,
    items: { include: { options: true } },
  } as const;
}

export async function getOperationsMetrics(now: Date = new Date()): Promise<OperationsMetrics> {
  if (!hasRuntimeDatabaseUrl()) {
    return {
      today: 0,
      toPrepare: 0,
      inProduction: 0,
      ready: 0,
      deliveries: 0,
      pickups: 0,
      overdue: 0,
      pendingPayment: 0,
      missingSchedule: 0,
    };
  }
  const prisma = getPrisma();
  const range = getBusinessDayRange(now);
  const todayDate = calendarDateToDb(range.today);
  const todayActive = {
    ...activeOperationalWhere,
    requestedDate: todayDate,
  };

  const [
    today,
    toPrepare,
    inProduction,
    ready,
    deliveries,
    pickups,
    overduePast,
    todayCandidates,
    pendingPayment,
    missingCandidates,
  ] = await Promise.all([
    prisma.order.count({ where: { ...activeOperationalWhere, requestedDate: todayDate } }),
    prisma.order.count({
      where: { ...todayActive, fulfillmentStatus: { in: ["PENDING", "CONFIRMED"] } },
    }),
    prisma.order.count({ where: { ...todayActive, fulfillmentStatus: "IN_PRODUCTION" } }),
    prisma.order.count({ where: { ...todayActive, fulfillmentStatus: "READY" } }),
    prisma.order.count({
      where: { ...todayActive, fulfillmentMethod: "DELIVERY" },
    }),
    prisma.order.count({
      where: { ...todayActive, fulfillmentMethod: "PICKUP" },
    }),
    prisma.order.count({
      where: { ...activeOperationalWhere, requestedDate: { lt: todayDate } },
    }),
    prisma.order.findMany({
      where: todayActive,
      select: {
        requestedDate: true,
        timeWindowStart: true,
        timeWindowEnd: true,
        fulfillmentStatus: true,
        status: true,
      },
    }),
    prisma.order.count({
      where: { status: "PENDING_PAYMENT", requestedDate: todayDate },
    }),
    prisma.order.findMany({
      where: activeOperationalWhere,
      select: {
        requestedDate: true,
        timeWindowStart: true,
        timeWindowEnd: true,
      },
      take: 200,
    }),
  ]);

  const overdueToday = todayCandidates.filter((row) =>
    isOrderOperationallyOverdue({ ...row, orderStatus: row.status, now }),
  ).length;
  const missingSchedule = missingCandidates.filter(isMissingOperationalSchedule).length;

  return {
    today,
    toPrepare,
    inProduction,
    ready,
    deliveries,
    pickups,
    overdue: overduePast + overdueToday,
    pendingPayment,
    missingSchedule,
  };
}

export async function countOperationsDashboard(now: Date = new Date()) {
  const metrics = await getOperationsMetrics(now);
  return {
    today: metrics.today,
    inProduction: metrics.inProduction,
    ready: metrics.ready,
    overdue: metrics.overdue,
  };
}

export async function listOperationsOrders(
  input: OperationsFilters = {},
  now: Date = new Date(),
): Promise<OperationsListResult> {
  const empty: OperationsListResult = {
    items: [],
    missingSchedule: [],
    pendingPayment: [],
    page: 1,
    pageCount: 1,
    total: 0,
  };
  if (!hasRuntimeDatabaseUrl()) {
    return empty;
  }

  const view = parseView(input.view);
  const page = Math.max(1, Number.parseInt(input.page ?? "1", 10) || 1);
  const method = input.method && isFulfillmentMethod(input.method) ? input.method : undefined;
  const fulfillmentStatus =
    input.fulfillmentStatus && isFulfillmentStatus(input.fulfillmentStatus)
      ? input.fulfillmentStatus
      : undefined;
  const type = parseType(input.type);
  const q = input.q?.trim() || undefined;
  const date = dateWhere(view, now);
  const paginate = view === "all";
  const take = paginate ? operationsPageSize : operationsAgendaLimit;

  const where: Prisma.OrderWhereInput = {
    ...(fulfillmentStatus === "COMPLETED" ? operationalWhere : activeOperationalWhere),
    ...(date ?? {}),
    ...(method ? { fulfillmentMethod: method } : {}),
    ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
    ...(type === "custom" ? { customOrder: true } : {}),
    ...(type === "standard" ? { customOrder: false } : {}),
    ...(q ? searchWhere(q) : {}),
  };

  const prisma = getPrisma();
  const [total, rows, missingRows, pendingRows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: listInclude(),
      orderBy: [{ requestedDate: "asc" }, { timeWindowStart: "asc" }],
      skip: paginate ? (page - 1) * take : 0,
      take,
    }),
    prisma.order.findMany({
      where: activeOperationalWhere,
      include: listInclude(),
      orderBy: [{ requestedDate: "asc" }],
      take: 100,
    }),
    view === "overdue"
      ? Promise.resolve([])
      : prisma.order.findMany({
          where: {
            status: "PENDING_PAYMENT",
            ...(date ?? {}),
            ...(method ? { fulfillmentMethod: method } : {}),
            ...(q ? searchWhere(q) : {}),
          },
          include: listInclude(),
          orderBy: [{ requestedDate: "asc" }, { timeWindowStart: "asc" }],
          take: 40,
        }),
  ]);

  let items = rows.map((row) => toCard(row, now));
  if (view === "overdue") {
    items = items.filter((item) => item.overdue);
  }
  items.sort(compareOperationalSchedule);

  const missingSchedule = missingRows
    .map((row) => toCard(row, now))
    .filter((item) => item.missingSchedule)
    .sort(compareOperationalSchedule);

  return {
    items,
    missingSchedule,
    pendingPayment: pendingRows.map((row) => toCard(row, now)),
    page,
    pageCount: Math.max(1, Math.ceil(total / take)),
    total: view === "overdue" ? items.length : total,
  };
}
