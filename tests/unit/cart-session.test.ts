import { describe, expect, it } from "vitest";
import { decideLegacyCartAction } from "@/modules/cart/domain/ownership";
import {
  pickShopperCart,
  planDeviceCookieAssociation,
  resolveHeaderCartCount,
  sumCartItemQuantities,
} from "@/modules/cart/domain/session-read";
import { hashCartToken } from "@/modules/cart/domain/token";

const now = new Date("2026-09-19T18:00:00.000Z");
const later = new Date("2026-09-20T18:00:00.000Z");
const earlier = new Date("2026-09-18T18:00:00.000Z");

describe("cart read path", () => {
  it("A) header count uses customer cart quantities without a cookie write", () => {
    const count = resolveHeaderCartCount({ signedIn: true, quantities: [2, 1] });
    expect(count).toBe(3);
    expect(sumCartItemQuantities([{ quantity: 2 }, { quantity: 1 }])).toBe(3);
  });

  it("B) finds the active cart by customerId without a cookie", () => {
    const found = pickShopperCart(
      [
        {
          id: "cross-device",
          status: "ACTIVE",
          expiresAt: later,
        },
      ],
      now,
    );
    expect(found?.id).toBe("cross-device");
  });

  it("C) logged out count is 0", () => {
    expect(resolveHeaderCartCount({ signedIn: false, quantities: [4] })).toBe(0);
  });

  it("D) signed-in customer without an active cart counts 0", () => {
    expect(resolveHeaderCartCount({ signedIn: true, quantities: null })).toBe(0);
    expect(
      pickShopperCart(
        [
          {
            id: "expired",
            status: "ACTIVE",
            expiresAt: earlier,
          },
        ],
        now,
      ),
    ).toBeNull();
  });

  it("keeps a PENDING_PAYMENT cart even if the TTL elapsed", () => {
    const found = pickShopperCart(
      [
        {
          id: "pending",
          status: "PENDING_PAYMENT",
          expiresAt: earlier,
        },
        {
          id: "active",
          status: "ACTIVE",
          expiresAt: later,
        },
      ],
      now,
    );
    expect(found?.id).toBe("pending");
  });
});

describe("cart mutation path", () => {
  it("E/F) login and add-to-cart can rotate a missing device cookie", () => {
    const plan = planDeviceCookieAssociation(null, "stored-hash", () => "new-raw", () => "new-hash");
    expect(plan).toEqual({
      action: "rotate",
      nextRaw: "new-raw",
      nextHash: "new-hash",
    });
  });

  it("keeps the cookie when the raw token already matches the hash", () => {
    const raw = "device-token";
    expect(planDeviceCookieAssociation(raw, hashCartToken(raw)).action).toBe("keep");
  });

  it("G) legacy anonymous claim stays on the mutation decision path", () => {
    expect(
      decideLegacyCartAction({
        cookieCart: { id: "anon", customerId: null },
        customerCartId: null,
        currentCustomerId: "c1",
      }),
    ).toBe("claim");
  });

  it("H) the read planner never asks to write a cookie", () => {
    const writes: string[] = [];
    pickShopperCart(
      [
        {
          id: "cart-1",
          status: "ACTIVE",
          expiresAt: later,
        },
      ],
      now,
    );
    resolveHeaderCartCount({ signedIn: true, quantities: [1] });
    expect(writes).toEqual([]);
  });
});
