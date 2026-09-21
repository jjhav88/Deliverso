import { notFound } from "next/navigation";
import { PromotionForm } from "@/modules/admin/components/promotion-form";
import { getAdminPromotion, listPromotionTargets } from "@/modules/promotions/admin-queries";
import { utcToMexicoCityLocal } from "@/modules/promotions/domain/admin-datetime";
import { minorToMoneyInput } from "@/modules/catalog/money-input";

function named(rows: Array<{ id: string; translations: Array<{ name: string }> }>) {
  return rows.map((row) => ({
    id: row.id,
    name: row.translations[0]?.name ?? row.id,
  }));
}

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPromotionEditPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const [promotion, targets] = await Promise.all([getAdminPromotion(id), listPromotionTargets()]);
  if (!promotion) {
    notFound();
  }

  const es = promotion.translations.find((item) => item.locale === "es-MX");
  const en = promotion.translations.find((item) => item.locale === "en-US");
  const selectedTargets =
    promotion.scopeType === "PRODUCT"
      ? promotion.products.map((item) => item.productId)
      : promotion.scopeType === "CATEGORY"
        ? promotion.categories.map((item) => item.categoryId)
        : promotion.scopeType === "UNIVERSE"
          ? promotion.universes.map((item) => item.universeId)
          : promotion.scopeType === "BUSINESS_LINE"
            ? promotion.businessLines.map((item) => item.businessLineId)
            : [];

  return (
    <PromotionForm
      initial={{
        id: promotion.id,
        internalName: promotion.internalName,
        mode: promotion.mode,
        status: promotion.status,
        code: promotion.normalizedCode ?? "",
        labelEs: es?.label ?? "",
        labelEn: en?.label ?? "",
        descriptionEs: es?.description ?? "",
        descriptionEn: en?.description ?? "",
        benefitType: promotion.benefitType,
        percentage: promotion.percentageBps ? String(promotion.percentageBps / 100) : "",
        fixedAmount: minorToMoneyInput(promotion.fixedAmountMinor),
        minSubtotal: minorToMoneyInput(promotion.minSubtotalMinor),
        maxDiscount: minorToMoneyInput(promotion.maxDiscountMinor),
        startsAt: utcToMexicoCityLocal(promotion.startsAt),
        endsAt: utcToMexicoCityLocal(promotion.endsAt),
        usageLimitTotal: promotion.usageLimitTotal?.toString() ?? "",
        usageLimitPerCustomer: promotion.usageLimitPerCustomer?.toString() ?? "",
        priority: String(promotion.priority),
        scopeType: promotion.scopeType,
        selectedTargets,
      }}
      targets={{
        products: named(targets.products),
        categories: named(targets.categories),
        universes: named(targets.universes),
        businessLines: named(targets.businessLines),
      }}
      activationError={query.error === "activation"}
    />
  );
}
