import { describe, expect, it } from "vitest";
import { persistCmsField, resolveCmsCopy } from "@/modules/home/cms-copy";
import { layoutHeroFan, capHeroSlots } from "@/modules/home/hero-slots";
import { homeCmsSaveSchema } from "@/modules/home/validation";
import {
  detectMediaMimeType,
  validateMediaFile,
} from "@/modules/media/validation";
import { emptyUploadSelection, formatFileSize } from "@/modules/media/format-file-size";
import { buildMediaObjectPath, isSafeMediaObjectPath } from "@/modules/media/object-path";
import { canDeleteMediaAsset, collectMediaUsage } from "@/modules/media/usage";
import { isSafeHttpsUrl } from "@/modules/settings/social-url";
import { siteSettingsSaveSchema } from "@/modules/settings/validation";
import { normalizeWhatsappNumber, whatsappHref } from "@/modules/settings/whatsapp";

const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("media validation", () => {
  it("accepts jpeg and png signatures", () => {
    expect(detectMediaMimeType(jpeg)).toBe("image/jpeg");
    expect(detectMediaMimeType(png)).toBe("image/png");
    expect(
      validateMediaFile({ sizeBytes: jpeg.length, declaredMime: "image/jpeg", bytes: jpeg }).ok,
    ).toBe(true);
  });

  it("rejects svg-like and oversized files", () => {
    const svg = new TextEncoder().encode("<svg></svg>");
    expect(validateMediaFile({ sizeBytes: svg.length, bytes: svg }).ok).toBe(false);
    expect(
      validateMediaFile({ sizeBytes: 11 * 1024 * 1024, bytes: jpeg }).ok,
    ).toBe(false);
  });

  it("builds safe object paths", () => {
    const path = buildMediaObjectPath({
      id: "11111111-1111-4111-8111-111111111111",
      mimeType: "image/webp",
      now: new Date("2026-09-16T00:00:00Z"),
    });
    expect(path).toBe("media/2026/09/11111111-1111-4111-8111-111111111111.webp");
    expect(isSafeMediaObjectPath(path)).toBe(true);
    expect(isSafeMediaObjectPath("../secret.webp")).toBe(false);
  });
});

describe("media delete references", () => {
  it("blocks delete when used by hero, product or universe", () => {
    expect(
      canDeleteMediaAsset({
        productMediaCount: 0,
        heroShowcaseCount: 1,
        heroActive: true,
        universeCount: 0,
      }),
    ).toBe(false);
    expect(
      collectMediaUsage({
        productMediaCount: 1,
        heroShowcaseCount: 0,
        heroActive: false,
        universeCount: 0,
      })[0]?.kind,
    ).toBe("product");
    expect(
      collectMediaUsage({
        productMediaCount: 0,
        heroShowcaseCount: 0,
        heroActive: false,
        universeCount: 1,
      })[0]?.kind,
    ).toBe("universe");
    expect(
      canDeleteMediaAsset({
        productMediaCount: 0,
        heroShowcaseCount: 0,
        heroActive: false,
        universeCount: 0,
      }),
    ).toBe(true);
  });
});

describe("hero slots", () => {
  it("layouts 0/1/2/3 images", () => {
    expect(layoutHeroFan([])).toEqual([]);
    expect(
      layoutHeroFan([{ mediaAssetId: "a", publicUrl: "/a.jpg" }])[0]?.position,
    ).toBe("right");
    const two = layoutHeroFan([
      { mediaAssetId: "a", publicUrl: "/a.jpg" },
      { mediaAssetId: "b", publicUrl: "/b.jpg" },
    ]);
    expect(two.map((item) => item.position)).toEqual(["left", "right"]);
    const three = layoutHeroFan([
      { mediaAssetId: "a", publicUrl: "/a.jpg" },
      { mediaAssetId: "b", publicUrl: "/b.jpg" },
      { mediaAssetId: "c", publicUrl: "/c.jpg" },
    ]);
    expect(three.map((item) => item.position)).toEqual([
      "left",
      "right",
      "rightSecondary",
    ]);
    expect(capHeroSlots([1, 2, 3, 4]).length).toBe(3);
  });
});

describe("home copy schema", () => {
  it("rejects oversized headlines", () => {
    const result = homeCmsSaveSchema.safeParse({
      visibility: {
        showIntroduction: true,
        showFeaturedProducts: true,
        showUniverses: true,
        showPersonalization: true,
        showValueProposition: true,
        showFinalCta: true,
      },
      hero: {
        isActive: true,
        tone: "AUTO",
        leftMediaAssetId: "",
        centerMediaAssetId: "",
        rightMediaAssetId: "",
      },
      es: { heroHeadline: "x".repeat(121) },
      en: {},
    });
    expect(result.success).toBe(false);
  });
});

describe("settings schema and urls", () => {
  it("rejects javascript urls and accepts https", () => {
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("https://instagram.com/deliverso")).toBe(true);
    expect(siteSettingsSaveSchema.safeParse({
      facebookUrl: "javascript:alert(1)",
      facebookActive: true,
      instagramActive: false,
      tiktokActive: false,
    }).success).toBe(false);
  });

  it("normalizes whatsapp without a hardcoded country", () => {
    expect(normalizeWhatsappNumber("+52 55 1234 5678")).toBe("+525512345678");
    expect(whatsappHref("+525512345678")).toBe("https://wa.me/525512345678");
  });
});

describe("cms copy null vs empty", () => {
  it("uses i18n fallback when the DB value is null", () => {
    expect(resolveCmsCopy(null, "Pastelería creativa")).toBe("Pastelería creativa");
    expect(resolveCmsCopy(undefined, "Creative pastry")).toBe("Creative pastry");
  });

  it("does not fall back when the admin saved an empty string", () => {
    expect(resolveCmsCopy("", "Pastelería creativa")).toBe("");
    expect(resolveCmsCopy("", "Creative pastry")).toBe("");
  });

  it("uses the configured value for both locales", () => {
    expect(resolveCmsCopy("Edición limitada", "Pastelería creativa")).toBe(
      "Edición limitada",
    );
    expect(resolveCmsCopy("Limited edition", "Creative pastry")).toBe("Limited edition");
  });

  it("persists null until a value is saved, then empty string when cleared", () => {
    expect(persistCmsField("", null)).toBeNull();
    expect(persistCmsField("Hola", null)).toBe("Hola");
    expect(persistCmsField("", "Hola")).toBe("");
  });

  it("keeps empty strings in the Home save schema", () => {
    const result = homeCmsSaveSchema.safeParse({
      visibility: {
        showIntroduction: true,
        showFeaturedProducts: true,
        showUniverses: true,
        showPersonalization: true,
        showValueProposition: true,
        showFinalCta: true,
      },
      hero: {
        isActive: true,
        tone: "AUTO",
        leftMediaAssetId: "",
        centerMediaAssetId: "",
        rightMediaAssetId: "",
      },
      es: { heroHeadline: "" },
      en: { heroHeadline: "" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.es.heroHeadline).toBe("");
      expect(result.data.en.heroHeadline).toBe("");
    }
  });
});

describe("upload selection helpers", () => {
  it("formats sizes and resets selection", () => {
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe("2.4 MB");
    expect(emptyUploadSelection()).toEqual({
      previewUrl: null,
      fileName: null,
      fileSizeLabel: null,
    });
  });
});
