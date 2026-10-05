import { describe, expect, it } from "vitest";
import {
  getVisibleStorefrontSocial,
  storefrontSocial,
  storefrontSocialIds,
} from "@/config/storefront-contact";

describe("storefront social", () => {
  it("exposes social ids without placeholder live urls", () => {
    expect(storefrontSocial.map((item) => item.id)).toEqual([...storefrontSocialIds]);
    for (const profile of storefrontSocial) {
      expect(profile.href).toBeUndefined();
    }
  });

  it("renders only networks with a real url", () => {
    expect(getVisibleStorefrontSocial()).toEqual([]);
    expect(
      getVisibleStorefrontSocial([
        { id: "facebook", href: "https://facebook.com/deliverso" },
        { id: "instagram" },
        { id: "tiktok" },
      ]).map((item) => item.id),
    ).toEqual(["facebook"]);
  });
});
