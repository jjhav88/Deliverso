import { validateConfiguration } from "@/modules/catalog/pricing/validate-configuration";
import type {
  PricingResult,
  PricingSnapshot,
} from "@/modules/catalog/pricing/types";

export function priceConfiguredProduct(input: {
  snapshot: PricingSnapshot;
  selectedOptionIds: readonly string[];
  quantity: unknown;
}): PricingResult {
  const validated = validateConfiguration(
    input.snapshot,
    input.selectedOptionIds,
    input.quantity,
  );
  if (!validated.ok) {
    return validated;
  }

  const baseUnitPriceMinor = input.snapshot.variant.priceMinor ?? 0;
  const optionById = new Map(
    input.snapshot.groups.flatMap((group) =>
      group.options.map((option) => [option.id, option] as const),
    ),
  );

  let optionsDeltaMinor = 0;
  for (const optionId of validated.selectedOptionIds) {
    const option = optionById.get(optionId);
    const delta = option?.priceDeltaMinor ?? 0;
    optionsDeltaMinor += Math.max(0, delta);
  }

  const configuredUnitPriceMinor = Math.max(0, baseUnitPriceMinor + optionsDeltaMinor);
  const lineTotalMinor = configuredUnitPriceMinor * validated.quantity;

  return {
    ok: true,
    selectedOptionIds: validated.selectedOptionIds,
    baseUnitPriceMinor,
    optionsDeltaMinor,
    configuredUnitPriceMinor,
    lineTotalMinor,
    currency: "MXN",
  };
}
