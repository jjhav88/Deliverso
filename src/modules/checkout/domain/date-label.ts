export function formatCheckoutCalendarDate(calendarDate: string, locale: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(calendarDate);
  if (!match) {
    return calendarDate;
  }
  const utcNoon = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0));
  return new Intl.DateTimeFormat(locale === "en-US" ? "en-US" : "es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(utcNoon);
}

export function checkoutDateSelectOptions(input: {
  availableDates: Array<{ date: string; slots: Array<{ id: string }> }>;
  locale: string;
  placeholder: string;
}): Array<{ value: string; label: string }> {
  return [
    { value: "", label: input.placeholder },
    ...input.availableDates
      .filter((item) => item.slots.length > 0)
      .map((item) => ({
        value: item.date,
        label: formatCheckoutCalendarDate(item.date, input.locale),
      })),
  ];
}

export function checkoutTimeSelectOptions(input: {
  availableDates: Array<{ date: string; slots: Array<{ id: string; startTime: string; endTime: string }> }>;
  date: string;
  placeholder: string;
}): Array<{ value: string; label: string }> {
  const slots = input.availableDates.find((item) => item.date === input.date)?.slots ?? [];
  return [
    { value: "", label: input.placeholder },
    ...slots.map((slot) => ({
      value: slot.id,
      label: `${slot.startTime}–${slot.endTime}`,
    })),
  ];
}

export function nextCheckoutTimeAfterDateChange(): string {
  return "";
}

export function resolveCheckoutSlotSelection(input: {
  availableDates: Array<{ date: string; slots: Array<{ id: string }> }>;
  requestedDate: string | null;
  timeWindowId: string | null;
}): { date: string; timeWindowId: string } {
  const dates = input.availableDates.filter((item) => item.slots.length > 0);
  const dateStillValid = dates.some((item) => item.date === input.requestedDate);
  if (!dateStillValid || !input.requestedDate) {
    return { date: "", timeWindowId: "" };
  }
  const day = dates.find((item) => item.date === input.requestedDate);
  const timeStillValid = Boolean(day?.slots.some((slot) => slot.id === input.timeWindowId));
  return {
    date: input.requestedDate,
    timeWindowId: timeStillValid && input.timeWindowId ? input.timeWindowId : "",
  };
}
