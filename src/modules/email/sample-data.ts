import type { OrderEmailView, WelcomeEmailView } from "@/modules/email/domain/types";

export const sampleOrderVariants = ["delivery", "pickup", "multi", "configurable"] as const;
export type SampleOrderVariant = (typeof sampleOrderVariants)[number];

export function sampleWelcomeView(locale = "es-MX"): WelcomeEmailView {
  return {
    customerName: "Ana",
    locale,
  };
}

export function sampleOrderView(
  locale = "es-MX",
  variant: SampleOrderVariant | "DELIVERY" | "PICKUP" = "delivery",
): OrderEmailView {
  const normalized =
    variant === "DELIVERY" ? "delivery" : variant === "PICKUP" ? "pickup" : variant;
  const pickup = normalized === "pickup";
  const items =
    normalized === "multi"
      ? [
          item(locale, "Cheesecake de durazno", "Peach cheesecake", 1, 40000, []),
          item(locale, "Rol de canela", "Cinnamon roll", 2, 18000, []),
        ]
      : normalized === "configurable"
        ? [
            item(locale, "Pastel de chocolate", "Chocolate cake", 1, 45000, [
              [locale === "en-US" ? "Size" : "Tamaño", locale === "en-US" ? "Medium" : "Mediano"],
              [locale === "en-US" ? "Flavor" : "Sabor", "Chocolate"],
              [locale === "en-US" ? "Decoration" : "Decoración", locale === "en-US" ? "Gold leaf" : "Hoja de oro"],
            ]),
          ]
        : [
            item(locale, "Cheesecake de durazno", "Peach cheesecake", 1, 40000, [
              [locale === "en-US" ? "Size" : "Tamaño", "Mini"],
            ]),
          ];
  const itemsSubtotalMinor = items.reduce((sum, entry) => sum + entry.lineTotalMinor, 0);
  const deliveryFeeMinor = pickup ? 0 : 0;

  return {
    orderNumber: "DEL-260920-SAMPLE",
    customerName: "Ana",
    locale,
    fulfillmentMethod: pickup ? "PICKUP" : "DELIVERY",
    requestedDate: "2026-09-25",
    timeWindow: "10:00–14:00",
    itemsSubtotalMinor,
    deliveryFeeMinor,
    grandTotalMinor: itemsSubtotalMinor + deliveryFeeMinor,
    addressSummary: pickup ? null : "Av. Reforma 100, Juárez, Ciudad de México, 06600",
    addressLines: pickup
      ? []
      : ["Av. Reforma 100", "Juárez", "Ciudad de México, CDMX", "C.P. 06600"],
    pickupName: pickup ? "Obrera" : null,
    pickupAddress: pickup ? "Calle 12 45, Obrera, Ciudad de México" : null,
    displayCurrencyCode: null,
    displayTotalMinor: null,
    displayExchangeRate: null,
    displayExchangeProvider: null,
    displayExchangeSourceDate: null,
    items,
  };
}

function item(
  locale: string,
  es: string,
  en: string,
  quantity: number,
  unitMinor: number,
  options: Array<[string, string]>,
) {
  return {
    productName: locale === "en-US" ? en : es,
    variantName: null,
    quantity,
    lineTotalMinor: unitMinor * quantity,
    options: options.map(([groupName, optionName]) => ({ groupName, optionName })),
  };
}
