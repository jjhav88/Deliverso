import { describe, expect, it } from "vitest";
import { adminNavigation, getAdminNavigationItem } from "@/config/admin-navigation";
import { formAccepted } from "@/modules/legal/domain/acceptance";
import {
  cookieConsentDecision,
  cookieInventory,
} from "@/modules/legal/domain/cookie-inventory";
import { interpolateLegalBody } from "@/modules/legal/domain/interpolate";
import { parseLegalMarkdown } from "@/modules/legal/domain/markdown";
import { legalAcceptanceRows, orderLegalFieldData } from "@/modules/legal/domain/order-snapshot";
import { getLegalReadiness } from "@/modules/legal/domain/readiness";
import {
  COMMERCIAL_NAME,
  isPublicLegalDocument,
  type LegalIdentity,
} from "@/modules/legal/domain/types";
import { defaultLegalDocuments } from "@/modules/legal/documents/defaults";
import { privacyRequestSchema } from "@/modules/legal/validation";
import { adminAuditActions } from "@/modules/auth/domain/audit-actions";
import { permanentSeoRedirects } from "@/modules/seo/permanent-redirects";

const emptyIdentity = (): LegalIdentity => ({
  commercialName: COMMERCIAL_NAME,
  legalEntityName: null,
  rfc: null,
  legalAddress: null,
  legalPhone: null,
  contactEmail: null,
  privacyEmail: null,
  legalCountry: "México",
});

describe("legal readiness", () => {
  it("is INCOMPLETE when identity fields are missing", () => {
    const result = getLegalReadiness(emptyIdentity());
    expect(result.status).toBe("INCOMPLETE");
    expect(result.missing).toEqual([
      "legalEntityName",
      "rfc",
      "legalAddress",
      "legalPhone",
      "contactEmail",
      "privacyEmail",
    ]);
  });

  it("is READY only with complete identity", () => {
    const result = getLegalReadiness({
      commercialName: COMMERCIAL_NAME,
      legalEntityName: "Ejemplo SA de CV",
      rfc: "XAXX010101000",
      legalAddress: "Calle 1",
      legalPhone: "+52 55 0000 0000",
      contactEmail: "hola@example.com",
      privacyEmail: "privacidad@example.com",
      legalCountry: "México",
    });
    expect(result.status).toBe("READY");
    expect(result.missing).toEqual([]);
  });
});

describe("legal documents", () => {
  it("seeds five Spanish types and never invents a razón social", () => {
    expect(defaultLegalDocuments.map((item) => item.type)).toEqual([
      "PRIVACY_NOTICE",
      "TERMS",
      "DELIVERY_POLICY",
      "REFUND_POLICY",
      "COOKIE_POLICY",
    ]);
    expect(defaultLegalDocuments[0]?.body).toContain("{{legalEntityName}}");
    expect(defaultLegalDocuments[1]?.body).toContain("{{rfc}}");
    for (const document of defaultLegalDocuments) {
      expect(document.body).not.toMatch(/DELIVERSO SA|RFC inventado/i);
      expect(document.body).toMatch(/asesor legal mexicano/i);
    }
  });

  it("does not expose drafts publicly", () => {
    expect(isPublicLegalDocument("DRAFT")).toBe(false);
    expect(isPublicLegalDocument("ARCHIVED")).toBe(false);
    expect(isPublicLegalDocument("PUBLISHED")).toBe(true);
  });

  it("interpolates pending publication without filling fake identity", () => {
    const body = interpolateLegalBody("Responsable: {{legalEntityName}}", emptyIdentity());
    expect(body).toBe("Responsable: pendiente de publicación");
  });

  it("parses headings for a navigable table of contents", () => {
    const sections = parseLegalMarkdown("## Datos\n\nTexto.\n\n## Pagos\n\nStripe.");
    expect(sections.map((item) => item.id)).toEqual(["datos", "pagos"]);
  });
});

describe("checkout legal snapshot", () => {
  it("requires an explicit terms acceptance", () => {
    expect(formAccepted(null)).toBe(false);
    expect(formAccepted("")).toBe(false);
    expect(formAccepted("on")).toBe(true);
  });

  it("stores versions on the order and keeps an old snapshot unchanged", () => {
    const snapshot = {
      termsVersion: "1.0",
      deliveryPolicyVersion: "1.0",
      refundPolicyVersion: "1.0",
    };
    const created = orderLegalFieldData(snapshot);
    const later = orderLegalFieldData({
      termsVersion: "1.1",
      deliveryPolicyVersion: "1.1",
      refundPolicyVersion: "1.1",
    });
    expect(created.termsVersion).toBe("1.0");
    expect(later.termsVersion).toBe("1.1");
    expect(legalAcceptanceRows("customer-1", snapshot)).toHaveLength(3);
    expect(legalAcceptanceRows("customer-1", snapshot).every((row) => !("ip" in row))).toBe(
      true,
    );
  });
});

describe("privacy requests", () => {
  it("accepts ARCO types and rejects empty messages", () => {
    expect(
      privacyRequestSchema.safeParse({
        type: "ACCESS",
        email: "cliente@deliverso.com",
        message: "Quiero conocer mis datos personales.",
      }).success,
    ).toBe(true);
    expect(
      privacyRequestSchema.safeParse({
        type: "ACCESS",
        email: "cliente@deliverso.com",
        message: "Hola",
      }).success,
    ).toBe(false);
    expect(
      privacyRequestSchema.safeParse({
        type: "DOWNLOAD_ALL",
        email: "cliente@deliverso.com",
        message: "Quiero un expediente completo ahora.",
      }).success,
    ).toBe(false);
  });
});

describe("cookies", () => {
  it("inventories only essential first-party cookies and does not require a CMP", () => {
    expect(cookieInventory.every((item) => item.type === "essential")).toBe(true);
    expect(cookieInventory.some((item) => /analytics|ga|fbp|ads/i.test(item.name))).toBe(false);
    expect(cookieConsentDecision.bannerRequired).toBe(false);
    expect(cookieConsentDecision.cmpRequired).toBe(false);
  });
});

describe("admin legal", () => {
  it("protects legal under admin navigation", () => {
    expect(adminNavigation.find((item) => item.id === "legal")?.href).toBe("/admin/legal");
    expect(getAdminNavigationItem("/admin/legal/privacy-requests").id).toBe("legal");
    expect(adminAuditActions).toContain("LEGAL_DOCUMENT_PUBLISHED");
    expect(adminAuditActions).toContain("LEGAL_DOCUMENT_ARCHIVED");
  });
});

describe("terms alias", () => {
  it("redirects terminos-y-condiciones to the canonical terms path", () => {
    expect(permanentSeoRedirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/terminos-y-condiciones",
          destination: "/terminos",
          permanent: true,
        }),
      ]),
    );
  });
});
