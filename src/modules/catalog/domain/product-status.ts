export const productStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export type ProductStatus = (typeof productStatuses)[number];

export function isProductStatus(value: string): value is ProductStatus {
  return (productStatuses as readonly string[]).includes(value);
}
