import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { derivePromotionDisplayStatus, promotionDisplayLabel } from "@/modules/promotions/domain/display-status";
import type { PromotionStatus } from "@/modules/promotions/domain/types";

export async function listAdminPromotions(input: { status?: string | null; q?: string | null }) {
  const status = input.status && ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"].includes(input.status)
    ? (input.status as PromotionStatus)
    : undefined;
  const q = input.q?.trim();
  const rows = await getPrisma().promotion.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { internalName: { contains: q, mode: "insensitive" } },
              { normalizedCode: { contains: q.toUpperCase() } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      translations: true,
      reservations: { select: { status: true } },
    },
  });
  const now = new Date();
  return rows.map((row) => {
    const derived = derivePromotionDisplayStatus({
      status: row.status,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      now,
    });
    return {
      ...row,
      derived,
      derivedLabel: promotionDisplayLabel(derived),
      usedCount: row.reservations.filter((item) => item.status === "CONSUMED").length,
    };
  });
}

export async function getAdminPromotion(id: string) {
  return getPrisma().promotion.findUnique({
    where: { id },
    include: {
      translations: true,
      products: true,
      categories: true,
      universes: true,
      businessLines: true,
      reservations: { select: { status: true, expiresAt: true } },
    },
  });
}

export async function listPromotionTargets() {
  const prisma = getPrisma();
  const [products, categories, universes, businessLines] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        translations: { where: { locale: "es-MX" }, select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.category.findMany({
      select: {
        id: true,
        translations: { where: { locale: "es-MX" }, select: { name: true } },
      },
      take: 200,
    }),
    prisma.universe.findMany({
      select: {
        id: true,
        translations: { where: { locale: "es-MX" }, select: { name: true } },
      },
      take: 200,
    }),
    prisma.businessLine.findMany({
      select: {
        id: true,
        translations: { where: { locale: "es-MX" }, select: { name: true } },
      },
      take: 200,
    }),
  ]);
  return { products, categories, universes, businessLines };
}
