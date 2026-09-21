import { describe, expect, it } from "vitest";
import { businessTimezone, supportedDeliveryCountries } from "@/config/fulfillment";
import { canAuthorizeCheckoutDraft } from "@/modules/checkout/domain/ownership";
import { canCustomerStartCheckout, canEnterCheckout } from "@/modules/checkout/domain/cart-gate";
import { isDraftExpired } from "@/modules/checkout/domain/status";
import {
  lookupDeliveryZone,
  minimumOrderMessage,
  normalizeMexicanPostalCode,
  normalizePostalCode,
  parsePostalCodeList,
  resolveDeliveryZone,
  unavailablePostalCodeMessage,
} from "@/modules/checkout/domain/postal-code";
import {
  deliveryFeeMinor,
  estimatedTotalMinor,
  fulfillmentInvariantHolds,
  meetsMinimumOrder,
} from "@/modules/checkout/domain/fulfillment";
import { maxLeadTimeMinutes } from "@/modules/checkout/domain/lead-time";
import { sanitizeCheckoutNotes } from "@/modules/checkout/domain/notes";
import { hasOverlappingWindows, windowEndAfterStart } from "@/modules/checkout/domain/schedule";
import {
  earliestFulfillment,
  getAvailableFulfillmentDates,
  isRequestedSlotValid,
} from "@/modules/checkout/domain/dates";
import {
  checkoutDateSelectOptions,
  checkoutTimeSelectOptions,
  formatCheckoutCalendarDate,
  formatCheckoutReviewSchedule,
  nextCheckoutTimeAfterDateChange,
  resolveCheckoutSlotSelection,
} from "@/modules/checkout/domain/date-label";
import { canMarkCheckoutReady, evaluateCheckoutReady } from "@/modules/checkout/domain/ready";
import { buildCheckoutTotals } from "@/modules/checkout/domain/summary";
import { normalizePhone, isValidPhone } from "@/modules/customer-auth/domain/phone";
import { getZonedParts } from "@/modules/checkout/domain/timezone";

const zone = {
  id: "zone-1",
  isActive: true,
  deliveryFeeMinor: 8000,
  minimumOrderMinor: 50000,
};

const validCart = {
  itemCount: 1,
  items: [{ valid: true }],
  issues: [],
};

const schedule = [
  {
    dayOfWeek: 3,
    isActive: true,
    windows: [{ id: "w1", startTime: "10:00", endTime: "14:00", isActive: true, label: "Mañana" }],
  },
];

function readyBase() {
  return {
    now: new Date("2026-09-16T12:00:00.000Z"),
    customerStatus: "ACTIVE" as const,
    draftStatus: "IN_PROGRESS" as const,
    expiresAt: new Date("2026-09-17T12:00:00.000Z"),
    contactName: "Ana",
    contactEmail: "ana@deliverso.com",
    contactPhone: "+52 55 1234 5678",
    fulfillmentMethod: "DELIVERY" as const,
    deliveryZoneId: "zone-1",
    pickupLocationId: null,
    requestedDate: "2026-09-23",
    timeWindowId: "w1",
    itemsSubtotalMinor: 115000,
    pricingValid: true,
    cart: validCart,
    zone,
    pickup: null,
    address: {
      postalCode: "01000",
      street: "Reforma",
      city: "CDMX",
      state: "CDMX",
      countryCode: "MX",
    },
    leadMinutes: 0,
    schedule: [
      {
        dayOfWeek: 3,
        isActive: true,
        windows: [{ id: "w1", startTime: "10:00", endTime: "14:00", isActive: true }],
      },
    ],
    blackouts: [],
  };
}

describe("customer and cart gates", () => {
  it("requires an ACTIVE customer", () => {
    expect(canCustomerStartCheckout("ACTIVE")).toBe(true);
    expect(canCustomerStartCheckout("BLOCKED")).toBe(false);
    expect(canCustomerStartCheckout(null)).toBe(false);
  });

  it("blocks empty or invalid carts", () => {
    expect(canEnterCheckout({ itemCount: 0, items: [], issues: [] })).toBe(false);
    expect(
      canEnterCheckout({
        itemCount: 1,
        items: [{ valid: false }],
        issues: [{ code: "PRODUCT_UNAVAILABLE" }],
      }),
    ).toBe(false);
    expect(canEnterCheckout(validCart)).toBe(true);
  });
});

describe("draft ownership", () => {
  it("requires matching customer and cart", () => {
    expect(
      canAuthorizeCheckoutDraft({
        draftCustomerId: "c1",
        draftCartId: "cart1",
        customerId: "c1",
        cartId: "cart1",
        cartCustomerId: "c1",
      }),
    ).toBe(true);
    expect(
      canAuthorizeCheckoutDraft({
        draftCustomerId: "c1",
        draftCartId: "cart1",
        customerId: "c2",
        cartId: "cart1",
        cartCustomerId: "c1",
      }),
    ).toBe(false);
  });

  it("expires after the deadline", () => {
    expect(isDraftExpired(new Date("2026-09-16T00:00:00.000Z"), new Date("2026-09-16T00:00:01.000Z"))).toBe(true);
    expect(isDraftExpired(new Date("2026-09-17T00:00:00.000Z"), new Date("2026-09-16T00:00:00.000Z"))).toBe(false);
  });
});

describe("contact and notes", () => {
  it("normalizes phone without inventing a second helper", () => {
    expect(normalizePhone("  +52  55 1234  ")).toBe("+52 55 1234");
    expect(isValidPhone("55-1234-5678")).toBe(true);
    expect(isValidPhone("not-a-phone!")).toBe(false);
  });

  it("keeps notes as plain text", () => {
    expect(sanitizeCheckoutNotes("<b>Hola</b>")).toBe("Hola");
  });
});

describe("delivery zones", () => {
  it("keeps leading zeros and rejects invalid Mexican postal codes", () => {
    expect(normalizeMexicanPostalCode("06600")).toBe("06600");
    expect(normalizeMexicanPostalCode("06600 ")).toBe("06600");
    expect(normalizeMexicanPostalCode(" 06600")).toBe("06600");
    expect(normalizeMexicanPostalCode(" 06600 ")).toBe("06600");
    expect(normalizeMexicanPostalCode("6600")).toBeNull();
    expect(normalizeMexicanPostalCode("ABCDE")).toBeNull();
    expect(normalizeMexicanPostalCode(6600)).toBeNull();
    expect(normalizeMexicanPostalCode(6600 as unknown)).toBeNull();
    expect(normalizePostalCode("MX", " 06600 ")).toBe("06600");
  });

  it("resolves an active zone from countryCode + postalCode only", () => {
    expect(supportedDeliveryCountries).toEqual(["MX"]);
    expect(normalizePostalCode("MX", " 01000 ")).toBe("01000");
    expect(parsePostalCodeList("01000, 01000\n06600")).toEqual(["01000", "06600"]);
    const mapping = new Map([["MX:06600", zone]]);
    expect(lookupDeliveryZone({ countryCode: "MX", postalCode: "06600", mapping }).status).toBe("found");
    expect(resolveDeliveryZone({ countryCode: "MX", postalCode: "06600", mapping })?.id).toBe("zone-1");
    expect(lookupDeliveryZone({ countryCode: "MX", postalCode: "99999", mapping }).status).toBe("missing");
    expect(resolveDeliveryZone({ countryCode: "MX", postalCode: "99999", mapping })).toBeNull();
    expect(
      lookupDeliveryZone({
        countryCode: "MX",
        postalCode: "06600",
        mapping: new Map([["MX:06600", { ...zone, isActive: false }]]),
      }).status,
    ).toBe("inactive");
    expect(
      resolveDeliveryZone({
        countryCode: "MX",
        postalCode: "06600",
        mapping: new Map([["MX:06600", { ...zone, isActive: false }]]),
      }),
    ).toBeNull();
    expect(unavailablePostalCodeMessage).toBe("No tenemos entrega disponible en este código postal.");
    expect(minimumOrderMessage("$500.00")).toBe("Esta zona requiere un pedido mínimo de $500.00.");
  });

  it("applies server-side fee, minimum and estimated total", () => {
    expect(deliveryFeeMinor("DELIVERY", 8000)).toBe(8000);
    expect(deliveryFeeMinor("PICKUP", 8000)).toBe(0);
    expect(meetsMinimumOrder(115000, 50000)).toBe(true);
    expect(meetsMinimumOrder(10000, 50000)).toBe(false);
    expect(estimatedTotalMinor(115000, 8000)).toBe(123000);
    expect(buildCheckoutTotals({ itemsSubtotalMinor: 115000, method: "DELIVERY", zoneFeeMinor: 8000 })).toEqual({
      itemsSubtotalMinor: 115000,
      deliveryFeeMinor: 8000,
      estimatedTotalMinor: 123000,
      currency: "MXN",
    });
  });

  it("enforces delivery/pickup invariants", () => {
    expect(fulfillmentInvariantHolds({ method: "DELIVERY", deliveryZoneId: "z", pickupLocationId: null })).toBe(true);
    expect(fulfillmentInvariantHolds({ method: "PICKUP", deliveryZoneId: null, pickupLocationId: "p" })).toBe(true);
    expect(fulfillmentInvariantHolds({ method: "DELIVERY", deliveryZoneId: "z", pickupLocationId: "p" })).toBe(false);
  });
});

describe("lead time and timezone", () => {
  it("uses MAX lead time, not the sum", () => {
    expect(maxLeadTimeMinutes([240, 2880])).toBe(2880);
    expect(businessTimezone).toBe("America/Mexico_City");
  });

  it("computes earliest fulfillment from Mexico time plus lead", () => {
    const now = new Date("2026-09-16T18:00:00.000-06:00");
    const earliest = earliestFulfillment(now, 48 * 60);
    expect(earliest.date).toBe("2026-09-18");
    expect(getZonedParts(now).date).toBe("2026-09-16");
  });

  it("hides past dates, pre-lead slots and blackouts", () => {
    const now = new Date("2026-09-16T18:00:00.000-06:00");
    const available = getAvailableFulfillmentDates({
      now,
      leadMinutes: 48 * 60,
      method: "DELIVERY",
      schedule: [
        {
          dayOfWeek: 3,
          isActive: true,
          windows: [
            { id: "morning", startTime: "10:00", endTime: "14:00", isActive: true },
            { id: "evening", startTime: "18:00", endTime: "20:00", isActive: true },
          ],
        },
        {
          dayOfWeek: 5,
          isActive: true,
          windows: [
            { id: "morning", startTime: "10:00", endTime: "14:00", isActive: true },
            { id: "evening", startTime: "18:00", endTime: "20:00", isActive: true },
          ],
        },
      ],
      blackouts: [{ date: "2026-09-23", fulfillmentMethod: null, isActive: true }],
    });
    expect(available.some((day) => day.date === "2026-09-16")).toBe(false);
    const eighteenth = available.find((day) => day.date === "2026-09-18");
    expect(eighteenth?.slots.map((slot) => slot.id)).toEqual(["evening"]);
    expect(available.some((day) => day.date === "2026-09-23")).toBe(false);
  });

  it("revalidates a selected slot", () => {
    const now = new Date("2026-09-16T12:00:00.000Z");
    expect(
      isRequestedSlotValid({
        now,
        leadMinutes: 0,
        method: "DELIVERY",
        date: "2026-09-15",
        windowId: "w1",
        schedule,
        blackouts: [],
      }),
    ).toBe(false);
  });

  it("rejects overlapping windows and inverted clocks", () => {
    expect(windowEndAfterStart("10:00", "14:00")).toBe(true);
    expect(windowEndAfterStart("14:00", "10:00")).toBe(false);
    expect(
      hasOverlappingWindows([
        { startTime: "10:00", endTime: "14:00" },
        { startTime: "13:00", endTime: "18:00" },
      ]),
    ).toBe(true);
  });
});

describe("checkout date and time selects", () => {
  const dates = [
    {
      date: "2026-09-23",
      slots: [
        { id: "11111111-1111-4111-8111-111111111111", startTime: "10:00", endTime: "14:00" },
        { id: "22222222-2222-4222-8222-222222222222", startTime: "16:00", endTime: "18:00" },
      ],
    },
    {
      date: "2026-09-25",
      slots: [{ id: "33333333-3333-4333-8333-333333333333", startTime: "10:00", endTime: "14:00" }],
    },
    { date: "2026-09-26", slots: [] },
  ];

  it("formats locale labels and keeps the internal date value", () => {
    const es = checkoutDateSelectOptions({
      availableDates: dates,
      locale: "es-MX",
      placeholder: "Selecciona una fecha",
    });
    const en = checkoutDateSelectOptions({
      availableDates: dates,
      locale: "en-US",
      placeholder: "Select a date",
    });
    expect(es[0]).toEqual({ value: "", label: "Selecciona una fecha" });
    expect(es.map((item) => item.value)).toEqual(["", "2026-09-23", "2026-09-25"]);
    expect(es[1]?.label).toBe(formatCheckoutCalendarDate("2026-09-23", "es-MX"));
    expect(es[1]?.label).toMatch(/septiembre/);
    expect(es[1]?.label).not.toBe("2026-09-23");
    expect(en[1]?.label).toBe("Wednesday, September 23, 2026");
  });

  it("shows a human review schedule instead of ISO", () => {
    expect(
      formatCheckoutReviewSchedule({
        calendarDate: "2026-09-23",
        slotLabel: "10:00–14:00",
        locale: "es-MX",
      }),
    ).toBe(`${formatCheckoutCalendarDate("2026-09-23", "es-MX")} · 10:00–14:00`);
    expect(
      formatCheckoutReviewSchedule({
        calendarDate: "2026-09-23",
        slotLabel: "10:00–14:00",
        locale: "en-US",
      }),
    ).not.toContain("2026-09-23");
  });

  it("filters time windows to the selected date and resets time on date change", () => {
    const times = checkoutTimeSelectOptions({
      availableDates: dates,
      date: "2026-09-23",
      placeholder: "Selecciona un horario",
    });
    expect(times.map((item) => item.label)).toEqual([
      "Selecciona un horario",
      "10:00–14:00",
      "16:00–18:00",
    ]);
    expect(checkoutTimeSelectOptions({ availableDates: dates, date: "2026-09-25", placeholder: "x" }).map((item) => item.value)).toEqual([
      "",
      "33333333-3333-4333-8333-333333333333",
    ]);
    expect(nextCheckoutTimeAfterDateChange()).toBe("");
  });

  it("preloads a still-valid draft and resets an obsolete selection", () => {
    expect(
      resolveCheckoutSlotSelection({
        availableDates: dates,
        requestedDate: "2026-09-23",
        timeWindowId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({
      date: "2026-09-23",
      timeWindowId: "11111111-1111-4111-8111-111111111111",
    });
    expect(
      resolveCheckoutSlotSelection({
        availableDates: dates,
        requestedDate: "2026-09-23",
        timeWindowId: "missing-window",
      }),
    ).toEqual({ date: "2026-09-23", timeWindowId: "" });
    expect(
      resolveCheckoutSlotSelection({
        availableDates: dates,
        requestedDate: "2026-09-26",
        timeWindowId: "11111111-1111-4111-8111-111111111111",
      }),
    ).toEqual({ date: "", timeWindowId: "" });
  });

  it("keeps rejecting invalid combinations on the server", () => {
    expect(
      isRequestedSlotValid({
        now: new Date("2026-09-16T12:00:00.000Z"),
        leadMinutes: 0,
        method: "DELIVERY",
        date: "2026-09-23",
        windowId: "not-for-this-date",
        schedule,
        blackouts: [],
      }),
    ).toBe(false);
    expect(
      isRequestedSlotValid({
        now: new Date("2026-09-16T12:00:00.000Z"),
        leadMinutes: 0,
        method: "PICKUP",
        date: "2026-09-23",
        windowId: "w1",
        schedule: [],
        blackouts: [],
      }),
    ).toBe(false);
  });
});

describe("READY_FOR_PAYMENT", () => {
  it("accepts a complete delivery draft", () => {
    expect(canMarkCheckoutReady(readyBase())).toBe(true);
  });

  it("fails when the customer, cart, zone or slot is invalid", () => {
    expect(evaluateCheckoutReady({ ...readyBase(), customerStatus: "BLOCKED" })).toContain("CUSTOMER_INACTIVE");
    expect(evaluateCheckoutReady({ ...readyBase(), cart: { itemCount: 0, items: [], issues: [] } })).toContain(
      "CART_EMPTY",
    );
    expect(evaluateCheckoutReady({ ...readyBase(), zone: { ...zone, isActive: false } })).toContain("ZONE_INACTIVE");
    expect(evaluateCheckoutReady({ ...readyBase(), itemsSubtotalMinor: 1000 })).toContain("MINIMUM_ORDER");
    expect(evaluateCheckoutReady({ ...readyBase(), expiresAt: new Date("2026-09-15T00:00:00.000Z") })).toContain(
      "DRAFT_EXPIRED",
    );
  });
});
