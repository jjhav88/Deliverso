import { PromotionForm } from "@/modules/admin/components/promotion-form";
import { listPromotionTargets } from "@/modules/promotions/admin-queries";

function named(rows: Array<{ id: string; translations: Array<{ name: string }> }>) {
  return rows.map((row) => ({
    id: row.id,
    name: row.translations[0]?.name ?? row.id,
  }));
}

export default async function AdminPromotionNewPage() {
  const targets = await listPromotionTargets();

  return (
    <PromotionForm
      initial={{
        id: null,
        internalName: "",
        mode: "CODE",
        status: null,
        code: "",
        labelEs: "",
        labelEn: "",
        descriptionEs: "",
        descriptionEn: "",
        benefitType: "PERCENTAGE",
        percentage: "10",
        fixedAmount: "",
        minSubtotal: "",
        maxDiscount: "",
        startsAt: "",
        endsAt: "",
        usageLimitTotal: "",
        usageLimitPerCustomer: "",
        priority: "0",
        scopeType: "ORDER",
        selectedTargets: [],
      }}
      targets={{
        products: named(targets.products),
        categories: named(targets.categories),
        universes: named(targets.universes),
        businessLines: named(targets.businessLines),
      }}
    />
  );
}
