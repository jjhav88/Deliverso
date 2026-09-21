import "server-only";
import { getPrisma } from "@/server/db/prisma";
import { evaluatePromotionEligibility } from "@/modules/promotions/domain/eligibility";
import { resolveAppliedPromotion, selectAutomaticPromotion } from "@/modules/promotions/domain/selection";
import { buildPromotionTotals } from "@/modules/promotions/domain/totals";
import { reservationCountsTowardLimit } from "@/modules/promotions/domain/reservation";
import { mapPromotionRule } from "@/modules/promotions/map-rule";
import type { PromotionContext, PromotionItem, PromotionQuote, PromotionRule } from "@/modules/promotions/domain/types";

const promotionInclude = {
  translations: { select: { locale: true, label: true } },
  products: { select: { productId: true } },
  categories: { select: { categoryId: true } },
  universes: { select: { universeId: true } },
  businessLines: { select: { businessLineId: true } },
} as const;

export async function loadPromotionItems(productIds: string[], lineTotals: Map<string, number>): Promise<PromotionItem[]> {
  if (productIds.length === 0) {
    return [];
  }
  const products = await getPrisma().product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      businessLineId: true,
      categories: { select: { categoryId: true } },
      universes: { select: { universeId: true } },
    },
  });
  return products.map((product) => ({
    productId: product.id,
    lineTotalMinor: lineTotals.get(product.id) ?? 0,
    categoryIds: product.categories.map((item) => item.categoryId),
    universeIds: product.universes.map((item) => item.universeId),
    businessLineId: product.businessLineId,
  }));
}

async function usageCounts(promotionId: string, customerId: string, now: Date) {
  const rows = await getPrisma().promotionReservation.findMany({
    where: { promotionId, status: { in: ["RESERVED", "CONSUMED"] } },
    select: { customerId: true, status: true, expiresAt: true },
  });
  const active = rows.filter((row) =>
    reservationCountsTowardLimit({ status: row.status, expiresAt: row.expiresAt, now }),
  );
  return {
    reservedTotal: active.length,
    reservedForCustomer: active.filter((row) => row.customerId === customerId).length,
  };
}

function contextFrom(input: {
  customerId: string;
  items: PromotionItem[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  fulfillmentMethod?: "DELIVERY" | "PICKUP" | null;
  now: Date;
  reservedTotal: number;
  reservedForCustomer: number;
}): PromotionContext {
  return {
    customerId: input.customerId,
    items: input.items,
    subtotalMinor: input.subtotalMinor,
    deliveryFeeMinor: input.deliveryFeeMinor,
    fulfillmentMethod: input.fulfillmentMethod,
    now: input.now,
    reservedTotal: input.reservedTotal,
    reservedForCustomer: input.reservedForCustomer,
  };
}

export async function resolveCartPromotion(input: {
  customerId: string;
  selectedPromotionId: string | null | undefined;
  items: Array<{ productId: string; lineTotalMinor: number }>;
  subtotalMinor: number;
  locale: string;
  deliveryFeeMinor?: number;
  fulfillmentMethod?: "DELIVERY" | "PICKUP" | null;
  now?: Date;
}): Promise<{
  quote: PromotionQuote | null;
  totals: ReturnType<typeof buildPromotionTotals>;
  invalidated: boolean;
  selectedWasCode: boolean;
}> {
  const now = input.now ?? new Date();
  const lineTotals = new Map<string, number>();
  for (const item of input.items) {
    lineTotals.set(item.productId, (lineTotals.get(item.productId) ?? 0) + item.lineTotalMinor);
  }
  const items = await loadPromotionItems([...lineTotals.keys()], lineTotals);
  const prisma = getPrisma();

  let selectedRule: PromotionRule | null = null;
  if (input.selectedPromotionId) {
    const selected = await prisma.promotion.findUnique({
      where: { id: input.selectedPromotionId },
      include: promotionInclude,
    });
    if (selected) {
      selectedRule = mapPromotionRule(selected, input.locale);
    }
  }

  let selectedQuote: PromotionQuote | null = null;
  if (selectedRule) {
    const usage = await usageCounts(selectedRule.id, input.customerId, now);
    selectedQuote = evaluatePromotionEligibility(
      selectedRule,
      contextFrom({
        customerId: input.customerId,
        items,
        subtotalMinor: input.subtotalMinor,
        deliveryFeeMinor: input.deliveryFeeMinor ?? 0,
        fulfillmentMethod: input.fulfillmentMethod,
        now,
        ...usage,
      }),
    );
  }

  const selectedWasCode = selectedRule?.mode === "CODE";
  const invalidated = Boolean(selectedWasCode && selectedQuote && !selectedQuote.isEligible);

  let automaticQuote: PromotionQuote | null = null;
  if (!selectedWasCode || !selectedQuote?.isEligible) {
    const automatics = await prisma.promotion.findMany({
      where: { mode: "AUTOMATIC", status: "ACTIVE" },
      include: promotionInclude,
    });
    const rules = automatics.map((row) => mapPromotionRule(row, input.locale));
    const quotes: PromotionQuote[] = [];
    for (const rule of rules) {
      const usage = await usageCounts(rule.id, input.customerId, now);
      quotes.push(
        evaluatePromotionEligibility(
          rule,
          contextFrom({
            customerId: input.customerId,
            items,
            subtotalMinor: input.subtotalMinor,
            deliveryFeeMinor: input.deliveryFeeMinor ?? 0,
            fulfillmentMethod: input.fulfillmentMethod,
            now,
            ...usage,
          }),
        ),
      );
    }
    automaticQuote = selectAutomaticPromotion({ quotes, rules });
  }

  const quote = resolveAppliedPromotion({
    selectedCodeQuote: selectedWasCode ? selectedQuote : null,
    automaticQuote,
  });

  const totals = buildPromotionTotals({
    subtotalMinor: input.subtotalMinor,
    deliveryFeeMinor: input.deliveryFeeMinor ?? 0,
    discountMinor: quote?.discountMinor ?? 0,
    deliveryDiscountMinor: quote?.deliveryDiscountMinor ?? 0,
  });

  return { quote, totals, invalidated, selectedWasCode };
}
