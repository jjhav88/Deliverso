import type { OptionSelectionType } from "@/modules/catalog/domain/option-selection";

export type OptionGroupRuleInput = {
  selectionType: OptionSelectionType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
};

export function validateOptionGroupRules(
  input: OptionGroupRuleInput,
): string | null {
  if (!Number.isInteger(input.minSelections) || input.minSelections < 0) {
    return "minSelections debe ser un entero mayor o igual a 0.";
  }
  if (!Number.isInteger(input.maxSelections) || input.maxSelections < input.minSelections) {
    return "maxSelections debe ser mayor o igual que minSelections.";
  }
  if (input.selectionType === "SINGLE" && input.maxSelections !== 1) {
    return "Un grupo SINGLE debe tener maxSelections = 1.";
  }
  if (input.isRequired && input.minSelections < 1) {
    return "Un grupo requerido debe tener minSelections de al menos 1.";
  }
  return null;
}
