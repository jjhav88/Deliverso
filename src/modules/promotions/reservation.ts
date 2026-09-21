import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { reservationCountsTowardLimit } from "@/modules/promotions/domain/reservation";

type Tx = Prisma.TransactionClient;

export async function lockPromotionRow(tx: Tx, promotionId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "Promotion" WHERE id = ${promotionId}::uuid FOR UPDATE`;
}

export async function countActivePromotionUsage(
  tx: Tx,
  input: { promotionId: string; customerId?: string; now: Date },
): Promise<number> {
  const rows = await tx.promotionReservation.findMany({
    where: {
      promotionId: input.promotionId,
      ...(input.customerId ? { customerId: input.customerId } : {}),
      status: { in: ["RESERVED", "CONSUMED"] },
    },
    select: { status: true, expiresAt: true },
  });
  return rows.filter((row) =>
    reservationCountsTowardLimit({ status: row.status, expiresAt: row.expiresAt, now: input.now }),
  ).length;
}

export async function createPromotionReservation(
  tx: Tx,
  input: {
    promotionId: string;
    customerId: string;
    orderId: string;
    expiresAt: Date;
    now: Date;
  },
): Promise<{ ok: true } | { ok: false; reason: "USAGE_LIMIT" | "CUSTOMER_LIMIT" }> {
  const existing = await tx.promotionReservation.findUnique({
    where: { orderId: input.orderId },
    select: { id: true },
  });
  if (existing) {
    return { ok: true };
  }

  await lockPromotionRow(tx, input.promotionId);
  const promotion = await tx.promotion.findUnique({
    where: { id: input.promotionId },
    select: { usageLimitTotal: true, usageLimitPerCustomer: true },
  });
  if (!promotion) {
    return { ok: false, reason: "USAGE_LIMIT" };
  }

  const totalUsed = await countActivePromotionUsage(tx, {
    promotionId: input.promotionId,
    now: input.now,
  });
  if (promotion.usageLimitTotal != null && totalUsed >= promotion.usageLimitTotal) {
    return { ok: false, reason: "USAGE_LIMIT" };
  }

  const customerUsed = await countActivePromotionUsage(tx, {
    promotionId: input.promotionId,
    customerId: input.customerId,
    now: input.now,
  });
  if (promotion.usageLimitPerCustomer != null && customerUsed >= promotion.usageLimitPerCustomer) {
    return { ok: false, reason: "CUSTOMER_LIMIT" };
  }

  await tx.promotionReservation.create({
    data: {
      promotionId: input.promotionId,
      customerId: input.customerId,
      orderId: input.orderId,
      status: "RESERVED",
      expiresAt: input.expiresAt,
    },
  });
  return { ok: true };
}

export async function consumePromotionReservation(tx: Tx, orderId: string): Promise<void> {
  const current = await tx.promotionReservation.findUnique({
    where: { orderId },
    select: { id: true, status: true },
  });
  if (!current || current.status === "CONSUMED" || current.status === "RELEASED") {
    return;
  }
  await tx.promotionReservation.update({
    where: { id: current.id },
    data: { status: "CONSUMED", consumedAt: new Date() },
  });
}

export async function releasePromotionReservation(tx: Tx, orderId: string): Promise<void> {
  const current = await tx.promotionReservation.findUnique({
    where: { orderId },
    select: { id: true, status: true },
  });
  if (!current || current.status !== "RESERVED") {
    return;
  }
  await tx.promotionReservation.update({
    where: { id: current.id },
    data: { status: "RELEASED", releasedAt: new Date() },
  });
}

export async function releaseExpiredPromotionReservations(now = new Date()) {
  const stale = await (await import("@/server/db/prisma")).getPrisma().promotionReservation.updateMany({
    where: {
      status: "RESERVED",
      expiresAt: { lte: now },
    },
    data: { status: "RELEASED", releasedAt: now },
  });
  return {
    processed: stale.count,
    updated: stale.count,
    skipped: 0,
    failed: 0,
  };
}
