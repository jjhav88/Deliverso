import { describe, expect, it } from "vitest";
import {
  getVisibleStorefrontSocial,
  storefrontContact,
  storefrontSocial,
  storefrontSocialIds,
} from "@/config/storefront-contact";

describe("storefrontContact", () => {
  it("centralizes temporary contact fields for future Admin", () => {
    expect(storefrontContact.email).toBe("contacto@deliverso.com");
    expect(storefrontContact.whatsappDisplay).toMatch(/^\+52/);
    expect(storefrontContact.whatsappHref).toBeUndefined();
    expect(storefrontContact.address).toContain("México");
  });

  it("exposes social profiles without fake live urls", () => {
    expect(storefrontSocial.map((item) => item.id)).toEqual([
      ...storefrontSocialIds,
    ]);

    for (const profile of storefrontSocial) {
      expect(profile.href).toBeUndefined();
    }
  });

  it("keeps placeholder networks visible until a real url exists", () => {
    expect(getVisibleStorefrontSocial()).toHaveLength(3);
    expect(
      getVisibleStorefrontSocial([
        { id: "facebook", href: "https://facebook.com/deliverso" },
        { id: "instagram" },
        { id: "tiktok" },
      ]).map((item) => item.id),
    ).toEqual(["facebook"]);
  });
});
