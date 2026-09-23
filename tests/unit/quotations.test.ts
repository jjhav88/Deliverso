import { describe, expect, it } from "vitest";
import { adminNavigation } from "@/config/admin-navigation";
import { isStripePaymentAmountValid } from "@/modules/orders/domain/payment-status";
import {
  buildQuoteAttachmentPath,
  detectQuoteAttachmentMime,
  isOwnedQuoteAttachmentPath,
  MAX_QUOTE_ATTACHMENT_BYTES,
  validateQuoteAttachment,
} from "@/modules/quotations/domain/attachments";
import { evaluateQuotationConversion, nextOfferVersion } from "@/modules/quotations/domain/conversion";
import { quotationStatusLabel } from "@/modules/quotations/domain/labels";
import {
  canAccessCustomerQuotation,
  canAdminCancel,
  canAdminOffer,
  canAdminRequestInfo,
  canAdminStartReview,
  canCustomerAccept,
  canCustomerCancel,
  canCustomerDecline,
  canCustomerReply,
  isQuoteExpired,
  nextStatusAfterCustomerReply,
} from "@/modules/quotations/domain/lifecycle";
import { buildQuoteOfferTotals, isValidQuotedTotal } from "@/modules/quotations/domain/money";
import { formatQuoteNumber, isQuoteNumberFormat } from "@/modules/quotations/domain/quote-number";
import { getEmailHeadline, getEmailIntro } from "@/modules/email/domain/presentation";
import { getEmailSubject } from "@/modules/email/domain/subjects";
import { renderTransactionalEmail } from "@/modules/email/templates/render";
import { sampleQuoteView } from "@/modules/email/sample-data";
import { applySandboxSubject } from "@/modules/email/domain/mode";

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0x00]);
const now = new Date("2026-09-23T18:00:00.000Z");

describe("quote numbers and labels", () => {
  it("formats a human quote number", () => {
    expect(formatQuoteNumber(new Date("2026-09-23T00:00:00.000Z"), "AB23CD")).toBe("COT-260923-AB23CD");
    expect(isQuoteNumberFormat("COT-260923-AB23CD")).toBe(true);
    expect(isQuoteNumberFormat("uuid-looking")).toBe(false);
  });

  it("humanizes statuses in ES and EN", () => {
    expect(quotationStatusLabel("NEEDS_INFO", "es-MX")).toBe("Información requerida");
    expect(quotationStatusLabel("QUOTED", "en-US")).toBe("Quoted");
    expect(quotationStatusLabel("CONVERTED", "es-MX")).toBe("Convertida");
  });
});

describe("lifecycle", () => {
  it("covers submit, review, needs info, reply, decline and cancel", () => {
    expect(canAdminStartReview("SUBMITTED")).toBe(true);
    expect(canAdminRequestInfo("IN_REVIEW")).toBe(true);
    expect(canCustomerReply("NEEDS_INFO")).toBe(true);
    expect(nextStatusAfterCustomerReply()).toBe("IN_REVIEW");
    expect(canCustomerDecline("QUOTED")).toBe(true);
    expect(canCustomerCancel("SUBMITTED")).toBe(true);
    expect(canCustomerCancel("QUOTED")).toBe(false);
    expect(canAdminCancel("QUOTED")).toBe(true);
    expect(canAdminCancel("ACCEPTED")).toBe(false);
    expect(canAdminOffer("QUOTED")).toBe(true);
    expect(canAccessCustomerQuotation("c1", "c1")).toBe(true);
    expect(canAccessCustomerQuotation("c1", "c2")).toBe(false);
  });

  it("expires quoted offers after validUntil", () => {
    expect(isQuoteExpired(now, new Date("2026-09-23T17:00:00.000Z"))).toBe(true);
    expect(canCustomerAccept("QUOTED", now, new Date("2026-09-24T00:00:00.000Z"))).toBe(true);
    expect(canCustomerAccept("QUOTED", now, new Date("2026-09-23T17:00:00.000Z"))).toBe(false);
  });
});

describe("quote money", () => {
  it("builds MXN totals without floats or $0", () => {
    expect(buildQuoteOfferTotals({ subtotalMinor: 450000, deliveryFeeMinor: 25000 })).toEqual({
      subtotalMinor: 450000,
      deliveryFeeMinor: 25000,
      totalMinor: 475000,
    });
    expect(buildQuoteOfferTotals({ subtotalMinor: 0, deliveryFeeMinor: 100 })).toEqual({
      ok: false,
      reason: "ZERO_VALUE",
    });
    expect(buildQuoteOfferTotals({ subtotalMinor: -1, deliveryFeeMinor: 0 })).toEqual({
      ok: false,
      reason: "ZERO_VALUE",
    });
    expect(buildQuoteOfferTotals({ subtotalMinor: 100, deliveryFeeMinor: -1 })).toEqual({
      ok: false,
      reason: "NEGATIVE",
    });
    expect(isValidQuotedTotal({ subtotalMinor: 10000, deliveryFeeMinor: 0, totalMinor: 10000 })).toBe(true);
    expect(isValidQuotedTotal({ subtotalMinor: 10000, deliveryFeeMinor: 0, totalMinor: 9999 })).toBe(false);
  });
});

describe("offer versions and conversion", () => {
  it("increments versions and accepts exactly one order", () => {
    expect(nextOfferVersion(0)).toBe(1);
    expect(nextOfferVersion(2)).toBe(3);
    const accepted = evaluateQuotationConversion({
      ownerId: "c1",
      customerId: "c1",
      status: "QUOTED",
      now,
      validUntil: new Date("2026-10-01T00:00:00.000Z"),
      hasActiveOffer: true,
      alreadyHasOrder: false,
      totals: { subtotalMinor: 40000, deliveryFeeMinor: 5000, totalMinor: 45000 },
      fulfillmentMethod: "PICKUP",
      hasAddress: false,
      hasPickup: true,
    });
    expect(accepted).toEqual({ ok: true, idempotent: false });
    const again = evaluateQuotationConversion({
      ownerId: "c1",
      customerId: "c1",
      status: "ACCEPTED",
      now,
      validUntil: new Date("2026-10-01T00:00:00.000Z"),
      hasActiveOffer: true,
      alreadyHasOrder: true,
      totals: { subtotalMinor: 40000, deliveryFeeMinor: 5000, totalMinor: 45000 },
      fulfillmentMethod: "PICKUP",
      hasAddress: false,
      hasPickup: true,
    });
    expect(again).toEqual({ ok: true, idempotent: true });
  });

  it("rejects ownership, expiration, $0 and missing delivery address", () => {
    expect(
      evaluateQuotationConversion({
        ownerId: "c1",
        customerId: "c2",
        status: "QUOTED",
        now,
        validUntil: new Date("2026-10-01T00:00:00.000Z"),
        hasActiveOffer: true,
        alreadyHasOrder: false,
        totals: { subtotalMinor: 100, deliveryFeeMinor: 0, totalMinor: 100 },
        fulfillmentMethod: "DELIVERY",
        hasAddress: true,
        hasPickup: false,
      }).ok,
    ).toBe(false);
    expect(
      evaluateQuotationConversion({
        ownerId: "c1",
        customerId: "c1",
        status: "QUOTED",
        now,
        validUntil: new Date("2026-09-01T00:00:00.000Z"),
        hasActiveOffer: true,
        alreadyHasOrder: false,
        totals: { subtotalMinor: 100, deliveryFeeMinor: 0, totalMinor: 100 },
        fulfillmentMethod: "PICKUP",
        hasAddress: false,
        hasPickup: true,
      }),
    ).toEqual({ ok: false, code: "EXPIRED" });
    expect(
      evaluateQuotationConversion({
        ownerId: "c1",
        customerId: "c1",
        status: "QUOTED",
        now,
        validUntil: new Date("2026-10-01T00:00:00.000Z"),
        hasActiveOffer: true,
        alreadyHasOrder: false,
        totals: { subtotalMinor: 0, deliveryFeeMinor: 0, totalMinor: 0 },
        fulfillmentMethod: "PICKUP",
        hasAddress: false,
        hasPickup: true,
      }),
    ).toEqual({ ok: false, code: "INVALID_TOTAL" });
    expect(
      evaluateQuotationConversion({
        ownerId: "c1",
        customerId: "c1",
        status: "QUOTED",
        now,
        validUntil: new Date("2026-10-01T00:00:00.000Z"),
        hasActiveOffer: true,
        alreadyHasOrder: false,
        totals: { subtotalMinor: 10000, deliveryFeeMinor: 2000, totalMinor: 12000 },
        fulfillmentMethod: "DELIVERY",
        hasAddress: false,
        hasPickup: false,
      }),
    ).toEqual({ ok: false, code: "ADDRESS_REQUIRED" });
  });
});

describe("stripe amount from quote", () => {
  it("matches quotedTotalMinor in MXN", () => {
    expect(
      isStripePaymentAmountValid({
        amount: 475000,
        currency: "mxn",
        expectedAmountMinor: 475000,
      }),
    ).toBe(true);
    expect(
      isStripePaymentAmountValid({
        amount: 475000,
        currency: "usd",
        expectedAmountMinor: 475000,
      }),
    ).toBe(false);
  });
});

describe("attachments", () => {
  it("accepts jpeg/png/webp and rejects invalid, oversized or extra files", () => {
    expect(detectQuoteAttachmentMime(jpeg)).toBe("image/jpeg");
    expect(validateQuoteAttachment({ sizeBytes: jpeg.length, bytes: jpeg, currentCount: 0 })).toEqual({
      ok: true,
      mime: "image/jpeg",
    });
    expect(validateQuoteAttachment({ sizeBytes: 10, bytes: new Uint8Array([0x3c, 0x73, 0x76, 0x67]), currentCount: 0 }).ok).toBe(false);
    expect(
      validateQuoteAttachment({
        sizeBytes: MAX_QUOTE_ATTACHMENT_BYTES + 1,
        bytes: jpeg,
        currentCount: 0,
      }),
    ).toEqual({ ok: false, reason: "too_large" });
    expect(validateQuoteAttachment({ sizeBytes: jpeg.length, bytes: jpeg, currentCount: 5 })).toEqual({
      ok: false,
      reason: "too_many",
    });
    const path = buildQuoteAttachmentPath({
      customerId: "c1",
      quotationId: "q1",
      fileId: "file-1",
      mime: "image/jpeg",
    });
    expect(path).toBe("customers/c1/q1/file-1.jpg");
    expect(isOwnedQuoteAttachmentPath({ customerId: "c1", quotationId: "q1", storagePath: path })).toBe(true);
    expect(isOwnedQuoteAttachmentPath({ customerId: "other", quotationId: "q1", storagePath: path })).toBe(false);
  });
});

describe("quote emails", () => {
  it("renders ES/EN quote templates as plain text with sandbox subjects", () => {
    const templates = [
      "QUOTE_RECEIVED",
      "QUOTE_NEEDS_INFO",
      "QUOTE_OFFERED",
      "QUOTE_ACCEPTED",
      "QUOTE_DECLINED",
      "QUOTE_EXPIRED",
    ] as const;
    for (const template of templates) {
      const es = renderTransactionalEmail({ template, quote: sampleQuoteView("es-MX") });
      const en = renderTransactionalEmail({ template, quote: sampleQuoteView("en-US") });
      expect(es.text.length).toBeGreaterThan(20);
      expect(en.text.length).toBeGreaterThan(20);
      expect(es.html).not.toContain("NEEDS_INFO");
      expect(applySandboxSubject("sandbox", getEmailSubject(template, "es-MX"))).toContain("[SANDBOX]");
    }
    expect(getEmailHeadline("QUOTE_RECEIVED", "es-MX")).toBe("Recibimos tu solicitud de cotización");
    expect(getEmailIntro("QUOTE_OFFERED", "en-US")).toContain("accept or decline");
    expect(renderTransactionalEmail({ template: "QUOTE_OFFERED", quote: sampleQuoteView("es-MX") }).text).toContain(
      "COT-260923-AB23CD",
    );
  });
});

describe("admin nav", () => {
  it("exposes quotations without soon", () => {
    expect(adminNavigation.find((item) => item.id === "quotations")).toMatchObject({
      href: "/admin/quotations",
      availability: "ready",
    });
  });
});
