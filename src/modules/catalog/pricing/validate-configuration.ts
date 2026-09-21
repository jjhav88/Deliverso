import { parseCartQuantity } from "@/modules/cart/domain/quantity";
import type {
  ConfigurationIssue,
  PricingFailure,
  PricingGroup,
  PricingSnapshot,
} from "@/modules/catalog/pricing/types";

export function failPricing(
  issue: ConfigurationIssue,
  message: string,
): PricingFailure {
  return { ok: false, issue, message };
}

export function validateConfiguration(
  snapshot: PricingSnapshot,
  selectedOptionIds: readonly string[],
  quantity: unknown,
): PricingFailure | { ok: true; quantity: number; selectedOptionIds: string[] } {
  const parsedQuantity = parseCartQuantity(quantity);
  if (parsedQuantity === null) {
    return failPricing("QUANTITY_INVALID", "La cantidad debe estar entre 1 y 99.");
  }

  if (snapshot.status !== "PUBLISHED") {
    return failPricing("PRODUCT_UNAVAILABLE", "El producto no está disponible.");
  }

  if (snapshot.type === "CUSTOM_QUOTE") {
    return failPricing("CUSTOM_QUOTE", "Este producto se cotiza por separado.");
  }

  if (!snapshot.variant.isActive) {
    return failPricing("VARIANT_UNAVAILABLE", "La variante no está disponible.");
  }

  if (snapshot.variant.priceMinor === null) {
    return failPricing("INVALID_CONFIGURATION", "El producto no tiene precio maestro.");
  }

  const uniqueIds = [...new Set(selectedOptionIds)];
  if (uniqueIds.length !== selectedOptionIds.length) {
    return failPricing("INVALID_CONFIGURATION", "Hay opciones duplicadas.");
  }

  const optionById = new Map(
    snapshot.groups.flatMap((group) =>
      group.options.map((option) => [option.id, { group, option }] as const),
    ),
  );

  for (const optionId of uniqueIds) {
    const found = optionById.get(optionId);
    if (!found) {
      return failPricing("INVALID_CONFIGURATION", "Una opción no pertenece a este producto.");
    }
    if (!found.group.isActive || !found.option.isActive) {
      return failPricing("OPTION_UNAVAILABLE", "Una opción ya no está disponible.");
    }
  }

  const selectedByGroup = new Map<string, string[]>();
  for (const optionId of uniqueIds) {
    const found = optionById.get(optionId);
    if (!found) {
      continue;
    }
    const current = selectedByGroup.get(found.group.id) ?? [];
    current.push(optionId);
    selectedByGroup.set(found.group.id, current);
  }

  for (const group of snapshot.groups) {
    if (!group.isActive) {
      if ((selectedByGroup.get(group.id) ?? []).length > 0) {
        return failPricing("OPTION_UNAVAILABLE", "Un grupo de opciones ya no está disponible.");
      }
      continue;
    }

    const selected = selectedByGroup.get(group.id) ?? [];
    const error = validateGroupSelection(group, selected);
    if (error) {
      return error;
    }
  }

  return { ok: true, quantity: parsedQuantity, selectedOptionIds: uniqueIds };
}

function validateGroupSelection(
  group: PricingGroup,
  selected: readonly string[],
): PricingFailure | null {
  if (group.selectionType === "SINGLE" && selected.length > 1) {
    return failPricing("INVALID_CONFIGURATION", "Este grupo solo admite una opción.");
  }

  if (selected.length < group.minSelections) {
    return failPricing(
      "INVALID_CONFIGURATION",
      group.isRequired
        ? "Falta completar un grupo obligatorio."
        : "No se alcanzó el mínimo de selecciones.",
    );
  }

  if (selected.length > group.maxSelections) {
    return failPricing("INVALID_CONFIGURATION", "Se superó el máximo de selecciones.");
  }

  return null;
}
