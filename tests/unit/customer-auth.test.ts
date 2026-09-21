import { describe, expect, it } from "vitest";
import { CART_MAX_QUANTITY } from "@/config/cart";
import {
  cartBelongsToCustomer,
  decideLegacyCartAction,
  mergeCartQuantities,
} from "@/modules/cart/domain/ownership";
import { buildCustomerAccountCreateInput } from "@/modules/customer-auth/domain/account";
import { normalizeEmail } from "@/modules/customer-auth/domain/email";
import { getSafeCustomerPath } from "@/modules/customer-auth/domain/safe-path";
import { canCustomerShop, isCustomerStatus } from "@/modules/customer-auth/domain/status";
import {
  customerRegisterSchema,
  CUSTOMER_PASSWORD_MIN,
} from "@/modules/customer-auth/validation";

describe("email normalization", () => {
  it("trims and lowercases without changing the password surface", () => {
    expect(normalizeEmail("  Alex@DELIVERSO.com ")).toBe("alex@deliverso.com");
  });
});

describe("safe customer next", () => {
  it("accepts internal paths and rejects open redirects", () => {
    expect(getSafeCustomerPath("/productos/cheesecake")).toBe("/productos/cheesecake");
    expect(getSafeCustomerPath("/en/cart")).toBe("/en/cart");
    expect(getSafeCustomerPath("https://evil.com")).toBe("/cuenta");
    expect(getSafeCustomerPath("//evil.com")).toBe("/cuenta");
    expect(getSafeCustomerPath("/admin")).toBe("/cuenta");
    expect(getSafeCustomerPath("/auth/confirm")).toBe("/cuenta");
    expect(getSafeCustomerPath("\\cuenta")).toBe("/cuenta");
  });
});

describe("customer status", () => {
  it("lets ACTIVE shop and blocks BLOCKED", () => {
    expect(isCustomerStatus("ACTIVE")).toBe(true);
    expect(canCustomerShop("ACTIVE")).toBe(true);
    expect(canCustomerShop("BLOCKED")).toBe(false);
  });
});

describe("account creation mapping", () => {
  it("copies operational email and consent timestamps, never a password", () => {
    const terms = new Date("2026-09-16T12:00:00.000Z");
    const mapped = buildCustomerAccountCreateInput({
      authUserId: "11111111-1111-4111-8111-111111111111",
      email: "  Cliente@Deliverso.com ",
      termsAcceptedAt: terms,
      privacyAcceptedAt: terms,
    });
    expect(mapped.email).toBe("cliente@deliverso.com");
    expect(mapped.termsAcceptedAt).toEqual(terms);
    expect(mapped.privacyAcceptedAt).toEqual(terms);
    expect(mapped).not.toHaveProperty("password");
    expect(mapped).not.toHaveProperty("passwordHash");
  });
});

describe("registration consent", () => {
  it("requires matching passwords and both consents", () => {
    const base = {
      email: "cliente@deliverso.com",
      password: "abcdefgh",
      confirmPassword: "abcdefgh",
      termsAccepted: true,
      privacyAccepted: true,
    };
    expect(customerRegisterSchema.safeParse(base).success).toBe(true);
    expect(
      customerRegisterSchema.safeParse({ ...base, password: "short" }).success,
    ).toBe(false);
    expect(
      customerRegisterSchema.safeParse({ ...base, confirmPassword: "otherpass" }).success,
    ).toBe(false);
    expect(
      customerRegisterSchema.safeParse({ ...base, termsAccepted: false }).success,
    ).toBe(false);
    expect(
      customerRegisterSchema.safeParse({ ...base, privacyAccepted: false }).success,
    ).toBe(false);
    expect(CUSTOMER_PASSWORD_MIN).toBe(8);
  });
});

describe("cart ownership", () => {
  it("never treats a foreign or anonymous cart as the current customer", () => {
    expect(cartBelongsToCustomer("aaa", "aaa")).toBe(true);
    expect(cartBelongsToCustomer("aaa", "bbb")).toBe(false);
    expect(cartBelongsToCustomer(null, "aaa")).toBe(false);
  });

  it("caps merged quantities at 99", () => {
    expect(mergeCartQuantities(40, 10)).toBe(50);
    expect(mergeCartQuantities(90, 20)).toBe(CART_MAX_QUANTITY);
  });

  it("claims anonymous carts and merges when the customer already has one", () => {
    expect(
      decideLegacyCartAction({
        cookieCart: { id: "anon", customerId: null },
        customerCartId: null,
        currentCustomerId: "c1",
      }),
    ).toBe("claim");
    expect(
      decideLegacyCartAction({
        cookieCart: { id: "anon", customerId: null },
        customerCartId: "owned",
        currentCustomerId: "c1",
      }),
    ).toBe("merge");
    expect(
      decideLegacyCartAction({
        cookieCart: { id: "foreign", customerId: "c2" },
        customerCartId: "owned",
        currentCustomerId: "c1",
      }),
    ).toBe("ignore");
  });
});
