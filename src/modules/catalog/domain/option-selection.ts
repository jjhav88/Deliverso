export const optionSelectionTypes = ["SINGLE", "MULTIPLE"] as const;

export type OptionSelectionType = (typeof optionSelectionTypes)[number];

export function isOptionSelectionType(
  value: string,
): value is OptionSelectionType {
  return (optionSelectionTypes as readonly string[]).includes(value);
}
