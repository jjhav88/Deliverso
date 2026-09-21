export const productTypes = [
  "STANDARD",
  "CONFIGURABLE",
  "CUSTOM_QUOTE",
] as const;

export type ProductType = (typeof productTypes)[number];

export function isProductType(value: string): value is ProductType {
  return (productTypes as readonly string[]).includes(value);
}
