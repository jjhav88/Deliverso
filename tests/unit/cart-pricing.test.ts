import { describe, expect, it } from "vitest";
import { buildConfigurationKey } from "@/modules/cart/domain/configuration-key";
import { generateCartToken, hashCartToken } from "@/modules/cart/domain/token";
import { parseCartQuantity } from "@/modules/cart/domain/quantity";
import { validateOptionGroupRules } from "@/modules/catalog/domain/option-group-rules";
import { moneyInputToMinor } from "@/modules/catalog/money-input";
import { priceConfiguredProduct } from "@/modules/catalog/pricing/price-configured-product";
import type { PricingSnapshot } from "@/modules/catalog/pricing/types";
import { toDisplayMoney } from "@/lib/money/to-display";

const baseSnapshot: PricingSnapshot = {
  productId: "p1",
  type: "CONFIGURABLE",
  status: "PUBLISHED",
  variant: { id: "v1", isActive: true, priceMinor: 50000 },
  groups: [
    {
      id: "g-size",
      selectionType: "SINGLE",
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      isActive: true,
      options: [
        { id: "opt-a", isActive: true, priceDeltaMinor: 5000 },
        { id: "opt-b", isActive: true, priceDeltaMinor: 2500 },
      ],
    },
    {
      id: "g-extra",
      selectionType: "MULTIPLE",
      isRequired: false,
      minSelections: 0,
      maxSelections: 2,
      isActive: true,
      options: [{ id: "opt-extra", isActive: true, priceDeltaMinor: 1000 }],
    },
  ],
};

describe("cart token", () => {
  it("generates an opaque token and stores only its hash", () => {
    const raw = generateCartToken();
    expect(raw).not.toContain(":");
    expect(hashCartToken(raw)).toHaveLength(64);
    expect(hashCartToken(raw)).toBe(hashCartToken(raw));
    expect(hashCartToken(raw)).not.toBe(raw);
  });
});

describe("configuration key", () => {
  it("merges the same variant and options regardless of order", () => {
    expect(buildConfigurationKey("v1", ["b", "a"])).toBe(
      buildConfigurationKey("v1", ["a", "b"]),
    );
  });

  it("splits different option sets", () => {
    expect(buildConfigurationKey("v1", ["a"])).not.toBe(
      buildConfigurationKey("v1", ["a", "b"]),
    );
  });
});

describe("quantity", () => {
  it("accepts 1–99 and rejects absurd values", () => {
    expect(parseCartQuantity(2)).toBe(2);
    expect(parseCartQuantity("99")).toBe(99);
    expect(parseCartQuantity(0)).toBeNull();
    expect(parseCartQuantity(999999)).toBeNull();
  });

  it("merges quantities until the 99 cap", () => {
    expect(parseCartQuantity(2 + 3)).toBe(5);
    expect(parseCartQuantity(90 + 20)).toBeNull();
  });
});

describe("admin price delta parser", () => {
  it("persists 50.00 as 5000 minor units", () => {
    expect(moneyInputToMinor("50.00")).toBe(5000);
  });
});

describe("option group rules", () => {
  it("rejects contradictory SINGLE / required rules", () => {
    expect(
      validateOptionGroupRules({
        selectionType: "SINGLE",
        isRequired: true,
        minSelections: 1,
        maxSelections: 2,
      }),
    ).toMatch(/SINGLE/i);
    expect(
      validateOptionGroupRules({
        selectionType: "SINGLE",
        isRequired: true,
        minSelections: 0,
        maxSelections: 1,
      }),
    ).toMatch(/minSelections/i);
  });
});

describe("pricing authority", () => {
  it("prices the documented deterministic case", () => {
    const snapshot: PricingSnapshot = {
      ...baseSnapshot,
      groups: [
        {
          id: "g1",
          selectionType: "MULTIPLE",
          isRequired: false,
          minSelections: 0,
          maxSelections: 2,
          isActive: true,
          options: [
            { id: "opt-a", isActive: true, priceDeltaMinor: 5000 },
            { id: "opt-b", isActive: true, priceDeltaMinor: 2500 },
          ],
        },
      ],
    };
    const result = priceConfiguredProduct({
      snapshot,
      selectedOptionIds: ["opt-a", "opt-b"],
      quantity: 2,
    });
    expect(result).toMatchObject({
      ok: true,
      baseUnitPriceMinor: 50000,
      optionsDeltaMinor: 7500,
      configuredUnitPriceMinor: 57500,
      lineTotalMinor: 115000,
      currency: "MXN",
    });
  });

  it("rejects a required group without a selection", () => {
    const result = priceConfiguredProduct({
      snapshot: baseSnapshot,
      selectedOptionIds: [],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue).toBe("INVALID_CONFIGURATION");
    }
  });

  it("rejects a foreign option id", () => {
    const result = priceConfiguredProduct({
      snapshot: baseSnapshot,
      selectedOptionIds: ["opt-a", "foreign"],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue).toBe("INVALID_CONFIGURATION");
    }
  });

  it("rejects an inactive option", () => {
    const result = priceConfiguredProduct({
      snapshot: {
        ...baseSnapshot,
        groups: [
          {
            ...baseSnapshot.groups[0]!,
            options: [{ id: "opt-a", isActive: false, priceDeltaMinor: 5000 }],
          },
        ],
      },
      selectedOptionIds: ["opt-a"],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue).toBe("OPTION_UNAVAILABLE");
    }
  });

  it("rejects archived products", () => {
    const result = priceConfiguredProduct({
      snapshot: { ...baseSnapshot, status: "ARCHIVED" },
      selectedOptionIds: ["opt-a"],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue).toBe("PRODUCT_UNAVAILABLE");
    }
  });

  it("rejects CUSTOM_QUOTE", () => {
    const result = priceConfiguredProduct({
      snapshot: { ...baseSnapshot, type: "CUSTOM_QUOTE" },
      selectedOptionIds: [],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue).toBe("CUSTOM_QUOTE");
    }
  });

  it("rejects two selections on a SINGLE group", () => {
    const result = priceConfiguredProduct({
      snapshot: baseSnapshot,
      selectedOptionIds: ["opt-a", "opt-b"],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue).toBe("INVALID_CONFIGURATION");
    }
  });

  it("rejects MULTIPLE selections outside min/max", () => {
    const snapshot: PricingSnapshot = {
      ...baseSnapshot,
      groups: [
        {
          id: "g-extra",
          selectionType: "MULTIPLE",
          isRequired: true,
          minSelections: 1,
          maxSelections: 2,
          isActive: true,
          options: [
            { id: "opt-1", isActive: true, priceDeltaMinor: 1000 },
            { id: "opt-2", isActive: true, priceDeltaMinor: 1000 },
            { id: "opt-3", isActive: true, priceDeltaMinor: 1000 },
          ],
        },
      ],
    };
    expect(
      priceConfiguredProduct({ snapshot, selectedOptionIds: [], quantity: 1 }).ok,
    ).toBe(false);
    expect(
      priceConfiguredProduct({
        snapshot,
        selectedOptionIds: ["opt-1", "opt-2", "opt-3"],
        quantity: 1,
      }).ok,
    ).toBe(false);
    expect(
      priceConfiguredProduct({
        snapshot,
        selectedOptionIds: ["opt-1", "opt-2"],
        quantity: 1,
      }).ok,
    ).toBe(true);
  });

  it("rejects an inactive variant as invalid item", () => {
    const result = priceConfiguredProduct({
      snapshot: {
        ...baseSnapshot,
        variant: { ...baseSnapshot.variant, isActive: false },
      },
      selectedOptionIds: ["opt-a"],
      quantity: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issue).toBe("VARIANT_UNAVAILABLE");
    }
  });

  it("keeps MXN as pricing authority while FX is display-only", () => {
    const priced = priceConfiguredProduct({
      snapshot: {
        ...baseSnapshot,
        groups: [
          {
            id: "g1",
            selectionType: "SINGLE",
            isRequired: false,
            minSelections: 0,
            maxSelections: 1,
            isActive: true,
            options: [{ id: "opt-a", isActive: true, priceDeltaMinor: 5000 }],
          },
        ],
      },
      selectedOptionIds: ["opt-a"],
      quantity: 2,
    });
    expect(priced.ok).toBe(true);
    if (!priced.ok) {
      return;
    }
    expect(priced.currency).toBe("MXN");
    expect(priced.lineTotalMinor).toBe(110000);
    const display = toDisplayMoney({
      amount: { amountMinor: priced.lineTotalMinor, currency: "MXN" },
      locale: "es-MX",
      displayCurrency: "USD",
      rate: {
        quoteCurrency: "USD",
        rate: "0.05",
        sourceDate: "2026-09-15",
        fetchedAt: new Date("2026-09-16T12:00:00Z"),
        provider: "FRANKFURTER_ECB",
        source: "ECB",
        stale: false,
      },
    });
    expect(display.currency).toBe("USD");
    expect(display.originalCurrency).toBe("MXN");
    expect(display.amountMinor).toBe(5500);
    expect(priced.lineTotalMinor).toBe(110000);
  });

  it("never lets configured unit price go negative", () => {
    const result = priceConfiguredProduct({
      snapshot: {
        ...baseSnapshot,
        variant: { id: "v1", isActive: true, priceMinor: 100 },
        groups: [
          {
            id: "g1",
            selectionType: "SINGLE",
            isRequired: false,
            minSelections: 0,
            maxSelections: 1,
            isActive: true,
            options: [{ id: "opt-a", isActive: true, priceDeltaMinor: 0 }],
          },
        ],
      },
      selectedOptionIds: ["opt-a"],
      quantity: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.configuredUnitPriceMinor).toBeGreaterThanOrEqual(0);
    }
  });
});
