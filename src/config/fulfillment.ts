export const businessTimezone = "America/Mexico_City";

export const supportedDeliveryCountries = ["MX"] as const;

export type DeliveryCountryCode = (typeof supportedDeliveryCountries)[number];

export const checkoutDraftTtlMs = 24 * 60 * 60 * 1000;

export const fulfillmentHorizonDays = 30;

export const checkoutNotesMaxLength = 1000;

export function isSupportedDeliveryCountry(
  value: string,
): value is DeliveryCountryCode {
  return (supportedDeliveryCountries as readonly string[]).includes(value);
}
