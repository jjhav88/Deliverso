export type ScheduledPlacement = {
  isActive: boolean;
  sortOrder: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
};

/**
 * null startsAt = no lower bound.
 * null endsAt = no expiry.
 */
export function isWithinSchedule(
  now: Date,
  startsAt?: Date | null,
  endsAt?: Date | null,
): boolean {
  if (startsAt && now < startsAt) {
    return false;
  }

  if (endsAt && now > endsAt) {
    return false;
  }

  return true;
}

export function selectScheduledPlacements<T extends ScheduledPlacement>(
  items: readonly T[],
  now: Date,
  limit?: number,
): T[] {
  const selected = items
    .filter(
      (item) =>
        item.isActive && isWithinSchedule(now, item.startsAt, item.endsAt),
    )
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (limit === undefined || limit < 0) {
    return selected;
  }

  return selected.slice(0, limit);
}
