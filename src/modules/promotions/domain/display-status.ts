import type { PromotionStatus } from "@/modules/promotions/domain/types";

export type DerivedPromotionDisplay =
  | "draft"
  | "scheduled"
  | "active"
  | "ended"
  | "paused"
  | "archived";

export function derivePromotionDisplayStatus(input: {
  status: PromotionStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  now: Date;
}): DerivedPromotionDisplay {
  if (input.status === "DRAFT") {
    return "draft";
  }
  if (input.status === "ARCHIVED") {
    return "archived";
  }
  if (input.status === "PAUSED") {
    return "paused";
  }
  if (input.startsAt && input.startsAt.getTime() > input.now.getTime()) {
    return "scheduled";
  }
  if (input.endsAt && input.endsAt.getTime() <= input.now.getTime()) {
    return "ended";
  }
  return "active";
}

export function promotionDisplayLabel(status: DerivedPromotionDisplay, locale: "es-MX" | "en-US" = "es-MX"): string {
  const labels = {
    "es-MX": {
      draft: "Borrador",
      scheduled: "Programada",
      active: "Activa",
      ended: "Finalizada",
      paused: "Pausada",
      archived: "Archivada",
    },
    "en-US": {
      draft: "Draft",
      scheduled: "Scheduled",
      active: "Active",
      ended: "Ended",
      paused: "Paused",
      archived: "Archived",
    },
  } as const;
  return labels[locale][status];
}
