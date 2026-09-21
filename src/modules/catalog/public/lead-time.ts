import type { AppLocale } from "@/config/i18n";

export type HumanLeadTime = {
  value: number;
  unit: "minutes" | "hours" | "days";
};

export function minutesToHumanLeadTime(
  minutes: number | null | undefined,
): HumanLeadTime | null {
  if (!minutes || minutes <= 0) {
    return null;
  }

  if (minutes % (24 * 60) === 0) {
    return { value: minutes / (24 * 60), unit: "days" };
  }

  if (minutes % 60 === 0) {
    return { value: minutes / 60, unit: "hours" };
  }

  return { value: minutes, unit: "minutes" };
}

export function formatHumanLeadTime(
  minutes: number | null | undefined,
  locale: AppLocale,
): string | null {
  const human = minutesToHumanLeadTime(minutes);
  if (!human) {
    return null;
  }

  if (locale === "en-US") {
    if (human.unit === "days") {
      return human.value === 1
        ? "Minimum preparation: 1 day"
        : `Minimum preparation: ${human.value} days`;
    }
    if (human.unit === "hours") {
      return human.value === 1
        ? "Minimum preparation: 1 hour"
        : `Minimum preparation: ${human.value} hours`;
    }
    return human.value === 1
      ? "Minimum preparation: 1 minute"
      : `Minimum preparation: ${human.value} minutes`;
  }

  if (human.unit === "days") {
    return human.value === 1
      ? "Preparación mínima: 1 día"
      : `Preparación mínima: ${human.value} días`;
  }
  if (human.unit === "hours") {
    return human.value === 1
      ? "Preparación mínima: 1 hora"
      : `Preparación mínima: ${human.value} horas`;
  }
  return human.value === 1
    ? "Preparación mínima: 1 minuto"
    : `Preparación mínima: ${human.value} minutos`;
}
