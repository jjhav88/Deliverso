export const RELATED_PRODUCT_LIMIT = 3;

export function pickRelatedProductIds(input: {
  currentId: string;
  universeMatches: readonly string[];
  categoryMatches: readonly string[];
  limit?: number;
}): string[] {
  const limit = input.limit ?? RELATED_PRODUCT_LIMIT;
  const seen = new Set<string>([input.currentId]);
  const result: string[] = [];

  for (const id of [...input.universeMatches, ...input.categoryMatches]) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}
