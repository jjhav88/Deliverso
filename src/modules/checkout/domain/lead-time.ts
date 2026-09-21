export function maxLeadTimeMinutes(values: readonly (number | null | undefined)[]): number {
  return values.reduce<number>((max, value) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return max;
    }
    return Math.max(max, value);
  }, 0);
}
