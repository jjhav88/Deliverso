export const FX_FRESH_TTL_MS = 12 * 60 * 60 * 1000;
export const FX_STALE_TTL_MS = 96 * 60 * 60 * 1000;

export type FxFreshness = "fresh" | "stale" | "expired" | "incomplete";

export function classifyFxSnapshotSet(
  fetchedAt: readonly Date[],
  now: Date,
  expectedCount: number,
): FxFreshness {
  if (fetchedAt.length < expectedCount) {
    return "incomplete";
  }

  const ages = fetchedAt.map((date) => now.getTime() - date.getTime());
  if (ages.every((age) => age <= FX_FRESH_TTL_MS)) {
    return "fresh";
  }
  if (ages.every((age) => age <= FX_STALE_TTL_MS)) {
    return "stale";
  }
  return "expired";
}
