import { describe, expect, it } from "vitest";
import {
  CustomerAuthError,
  isCustomerAuthError,
  navigationCustomerFallback,
} from "@/modules/customer-auth/domain/errors";
import { isTransientDatabaseError } from "@/server/db/errors";

describe("transient database errors", () => {
  it("recognizes Prisma 08006 / EAUTHTIMEOUT without treating it as logout", () => {
    const timeout = Object.assign(new Error("timeout while waiting for message"), {
      code: "EAUTHTIMEOUT",
      meta: { code: "08006" },
    });
    expect(isTransientDatabaseError(timeout)).toBe(true);
    expect(isTransientDatabaseError(new Error("invalid credentials"))).toBe(false);
  });
});

describe("customer auth error distinction", () => {
  it("keeps AUTH_REQUIRED, DATABASE_UNAVAILABLE and CUSTOMER_NOT_FOUND separate", () => {
    const unavailable = new CustomerAuthError("DATABASE_UNAVAILABLE");
    const authRequired = new CustomerAuthError("AUTH_REQUIRED");
    const notFound = new CustomerAuthError("CUSTOMER_NOT_FOUND");

    expect(isCustomerAuthError(unavailable, "DATABASE_UNAVAILABLE")).toBe(true);
    expect(isCustomerAuthError(authRequired, "DATABASE_UNAVAILABLE")).toBe(false);
    expect(isCustomerAuthError(notFound, "CUSTOMER_NOT_FOUND")).toBe(true);
    expect(navigationCustomerFallback(unavailable)).toBe("unavailable");
    expect(navigationCustomerFallback(authRequired)).toBe("rethrow");
    expect(navigationCustomerFallback(notFound)).toBe("rethrow");
  });
});
