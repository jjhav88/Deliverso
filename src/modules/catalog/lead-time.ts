export const leadTimeUnits = ["minutes", "hours", "days"] as const;

export type LeadTimeUnit = (typeof leadTimeUnits)[number];

export type LeadTimeInput = {
  value: number | null;
  unit: LeadTimeUnit;
};

export function leadTimeToMinutes(input: LeadTimeInput): number | null {
  if (input.value === null || Number.isNaN(input.value)) {
    return null;
  }

  if (input.value < 0) {
    throw new Error("El tiempo de preparación no puede ser negativo.");
  }

  if (input.value === 0) {
    return null;
  }

  if (input.unit === "days") {
    return input.value * 24 * 60;
  }

  if (input.unit === "hours") {
    return input.value * 60;
  }

  return input.value;
}

export function minutesToLeadTime(minutes: number | null | undefined): LeadTimeInput {
  if (!minutes) {
    return { value: null, unit: "hours" };
  }

  if (minutes % (24 * 60) === 0) {
    return { value: minutes / (24 * 60), unit: "days" };
  }

  if (minutes % 60 === 0) {
    return { value: minutes / 60, unit: "hours" };
  }

  return { value: minutes, unit: "minutes" };
}
