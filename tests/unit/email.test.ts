import { describe, expect, it } from "vitest";
import {
  fulfillmentEventKey,
  orderPaidEventKey,
  welcomeEventKey,
} from "@/modules/email/domain/event-keys";
import { templateForFulfillmentStatus } from "@/modules/email/domain/fulfillment-map";
import { exploreUrl, orderAccountPath, orderAccountUrl } from "@/modules/email/domain/links";
import { maskEmail } from "@/modules/email/domain/mask";
import {
  applySandboxSubject,
  canContactEmailProvider,
  canSendDevTestEmail,
  rejectEnabledEmailOutsideProduction,
  resolveProviderRecipient,
} from "@/modules/email/domain/mode";
import {
  classifyProviderFailure,
  isEligibleForDispatch,
  nextRetryAt,
  statusAfterFailure,
} from "@/modules/email/domain/retry";
import {
  containsInternalId,
  formatAddressLines,
  formatCustomerCalendarDate,
  formatCustomerTimeWindow,
  getEmailHeadline,
  getEmailIntro,
} from "@/modules/email/domain/presentation";
import { getEmailSubject } from "@/modules/email/domain/subjects";
import { FakeEmailProvider } from "@/modules/email/providers/fake";
import { sampleOrderView } from "@/modules/email/sample-data";
import { renderTransactionalEmail } from "@/modules/email/templates/render";
import { planPaymentIntentEvent } from "@/modules/orders/domain/webhook-plan";

describe("queue uniqueness", () => {
  it("uses a stable eventKey per customer welcome", () => {
    expect(welcomeEventKey("cus_1")).toBe("customer:cus_1:welcome:v1");
    expect(welcomeEventKey("cus_1")).toBe(welcomeEventKey("cus_1"));
  });

  it("uses a stable paid key so Stripe duplicates enqueue once", () => {
    expect(orderPaidEventKey("ord_1")).toBe("order:ord_1:paid:v1");
    const first = planPaymentIntentEvent({
      eventType: "payment_intent.succeeded",
      orderStatus: "PENDING_PAYMENT",
      paymentStatus: "REQUIRES_PAYMENT_METHOD",
      amount: 45000,
      currency: "mxn",
      expectedAmountMinor: 45000,
    });
    const second = planPaymentIntentEvent({
      eventType: "payment_intent.succeeded",
      orderStatus: "PAID",
      paymentStatus: "SUCCEEDED",
      amount: 45000,
      currency: "mxn",
      expectedAmountMinor: 45000,
    });
    expect(first.action).toBe("apply");
    expect(second.action).toBe("ignore");
  });

  it("keeps one fulfillment email per status", () => {
    expect(templateForFulfillmentStatus("READY")).toBe("ORDER_READY");
    expect(fulfillmentEventKey("ord_1", "READY")).toBe(
      fulfillmentEventKey("ord_1", "READY"),
    );
  });
});

describe("dispatch state machine", () => {
  it("moves pending to a sendable claim and records SENT conceptually", async () => {
    expect(isEligibleForDispatch({ status: "PENDING", nextAttemptAt: null })).toBe(true);
    const provider = new FakeEmailProvider();
    const first = await provider.send({
      to: "sandbox@example.com",
      subject: "test",
      html: "<p>ok</p>",
      text: "ok",
      idempotencyKey: "order:ord_1:paid:v1",
    });
    expect(first).toEqual({ ok: true, messageId: "fake_1" });
  });

  it("retries then marks DEAD after 5 failures", () => {
    expect(statusAfterFailure(1)).toBe("FAILED");
    expect(nextRetryAt(1, new Date("2026-09-20T12:00:00.000Z"))?.toISOString()).toBe(
      "2026-09-20T12:05:00.000Z",
    );
    expect(statusAfterFailure(5)).toBe("DEAD");
    expect(nextRetryAt(5)).toBeNull();
  });

  it("classifies invalid recipient as permanent", () => {
    expect(classifyProviderFailure("validation_error", "Invalid to address")).toBe("permanent");
    expect(statusAfterFailure(1, true)).toBe("DEAD");
  });

  it("lets only one worker send after exclusive claim", async () => {
    const provider = new FakeEmailProvider();
    let claimed = false;
    async function worker() {
      if (claimed) {
        return;
      }
      claimed = true;
      await provider.send({
        to: "sandbox@example.com",
        subject: "once",
        html: "<p>once</p>",
        text: "once",
      });
    }
    await Promise.all([worker(), worker()]);
    expect(provider.sent).toHaveLength(1);
  });
});

describe("sandbox and safety", () => {
  it("redirects provider recipient without rewriting the stored email", () => {
    const stored = "cliente@gmail.com";
    expect(
      resolveProviderRecipient({
        mode: "sandbox",
        recipientEmail: stored,
        sandboxRecipient: "dev@example.com",
      }),
    ).toBe("dev@example.com");
    expect(stored).toBe("cliente@gmail.com");
    expect(applySandboxSubject("sandbox", "Recibimos tu pedido DEL-1")).toBe(
      "[SANDBOX] Recibimos tu pedido DEL-1",
    );
    expect(canContactEmailProvider("disabled")).toBe(false);
    expect(rejectEnabledEmailOutsideProduction({ mode: "enabled", nodeEnv: "development" })).toBe(
      true,
    );
    expect(canSendDevTestEmail({ mode: "sandbox", nodeEnv: "development" })).toBe(true);
  });
});

describe("presentation", () => {
  it("formats customer dates in business timezone without ISO", () => {
    expect(formatCustomerCalendarDate("2026-09-23", "es-MX")).toBe("23 de septiembre de 2026");
    expect(formatCustomerCalendarDate("2026-09-23", "en-US")).toBe("September 23, 2026");
    expect(formatCustomerTimeWindow("Mañana · 10:00:00–14:00:00")).toBe("10:00–14:00");
  });

  it("formats address lines without turning them into a single blob", () => {
    expect(
      formatAddressLines({
        street: "Av. Reforma",
        exteriorNumber: "100",
        locality: "Juárez",
        city: "Ciudad de México",
        state: "CDMX",
        postalCode: "06600",
      }),
    ).toEqual(["Av. Reforma 100", "Juárez", "Ciudad de México, CDMX", "C.P. 06600"]);
  });
});

describe("templates", () => {
  it("renders ES paid copy with MXN, formatted date and account URL", () => {
    const view = sampleOrderView("es-MX", "delivery");
    const rendered = renderTransactionalEmail({
      template: "ORDER_PAID",
      order: view,
      publicUrl: "http://localhost:3010",
    });
    expect(getEmailHeadline("ORDER_PAID", "es-MX")).toBe("¡Recibimos tu pedido!");
    expect(getEmailIntro("ORDER_PAID", "es-MX")).toBe(
      "Tu pago fue confirmado y tu pedido ya forma parte de nuestro universo de sabores.",
    );
    expect(getEmailSubject("ORDER_PAID", "es-MX", view)).toBe(
      "Recibimos tu pedido DEL-260920-SAMPLE",
    );
    expect(rendered.html).toContain("¡Recibimos tu pedido!");
    expect(rendered.html).toContain("universo de sabores");
    expect(rendered.html).not.toContain("Tu pago fue confirmado.");
    expect(rendered.html).toContain("Total pagado");
    expect(rendered.html).toContain("$400.00 MXN");
    expect(rendered.html).not.toContain("Total pagado MXN:");
    expect(rendered.html).toContain("25 de septiembre de 2026");
    expect(rendered.html).not.toContain("2026-09-25");
    expect(rendered.html).toContain("10:00–14:00");
    expect(rendered.html).toContain("Cheesecake de durazno");
    expect(rendered.html).toContain("Tamaño: Mini");
    expect(rendered.html).toContain("Av. Reforma 100");
    expect(rendered.html).toContain("Ver mi pedido");
    expect(rendered.html).toContain("#234166");
    expect(rendered.html).not.toContain("unsubscribe");
    expect(rendered.html).not.toContain("[SANDBOX]");
    expect(rendered.text).toContain("¡Recibimos tu pedido!");
    expect(rendered.text).toContain("$400.00 MXN");
    expect(rendered.text).toContain("25 de septiembre de 2026");
    expect(rendered.text).toContain("/cuenta/pedidos/DEL-260920-SAMPLE");
    expect(containsInternalId(rendered.html)).toBe(false);
    expect(orderAccountPath("es-MX", "DEL-1")).toBe("/cuenta/pedidos/DEL-1");
  });

  it("renders EN pickup ready copy, location details and localized URL", () => {
    const view = sampleOrderView("en-US", "pickup");
    const rendered = renderTransactionalEmail({
      template: "ORDER_READY",
      order: view,
      publicUrl: "https://deliverso.com.mx",
    });
    expect(getEmailHeadline("ORDER_READY", "en-US", "PICKUP")).toBe(
      "Your order is ready for pickup",
    );
    expect(getEmailIntro("ORDER_READY", "en-US", "PICKUP")).not.toBe(
      getEmailHeadline("ORDER_READY", "en-US", "PICKUP"),
    );
    expect(getEmailSubject("ORDER_READY", "en-US", view)).toBe("Your order is ready for pickup");
    expect(rendered.html).toContain("Your order is ready for pickup");
    expect(rendered.html).toContain("waiting for you at our pickup point");
    expect(rendered.html).toContain("September 25, 2026");
    expect(rendered.html).toContain("Obrera");
    expect(rendered.html).toContain("View my order");
    expect(rendered.text).toContain("/en/account/orders/DEL-260920-SAMPLE");
    expect(orderAccountUrl({
      publicUrl: "https://deliverso.com.mx",
      locale: "en-US",
      orderNumber: "DEL-1",
    })).toBe("https://deliverso.com.mx/en/account/orders/DEL-1");
    expect(exploreUrl("https://deliverso.com.mx", "en-US")).toBe(
      "https://deliverso.com.mx/en/products",
    );
  });

  it("uses distinct delivery and pickup copy for ready and completed", () => {
    const delivery = sampleOrderView("es-MX", "delivery");
    const pickup = sampleOrderView("es-MX", "pickup");
    const readyDelivery = renderTransactionalEmail({ template: "ORDER_READY", order: delivery });
    const readyPickup = renderTransactionalEmail({ template: "ORDER_READY", order: pickup });
    const completedDelivery = renderTransactionalEmail({
      template: "ORDER_COMPLETED",
      order: delivery,
    });
    const completedPickup = renderTransactionalEmail({
      template: "ORDER_COMPLETED",
      order: pickup,
    });

    expect(readyDelivery.html).toContain("Tu pedido está listo");
    expect(readyDelivery.html).toContain("listo para iniciar su recorrido");
    expect(readyPickup.html).toContain("Tu pedido está listo para recoger");
    expect(readyPickup.html).toContain("punto de recogida");
    expect(completedDelivery.html).toContain("Tu pedido fue entregado");
    expect(completedDelivery.html).toContain("disfrutes cada bocado");
    expect(completedPickup.html).toContain("Pedido completado");
    expect(completedPickup.html).toContain("Gracias por recoger tu pedido");
  });

  it("renders multiple items, configurable options and no internal IDs", () => {
    const multi = renderTransactionalEmail({
      template: "ORDER_CONFIRMED",
      order: sampleOrderView("es-MX", "multi"),
    });
    const configurable = renderTransactionalEmail({
      template: "ORDER_IN_PRODUCTION",
      order: sampleOrderView("es-MX", "configurable"),
    });
    expect(multi.html).toContain("Cheesecake de durazno");
    expect(multi.html).toContain("Rol de canela");
    expect(multi.html).toContain("2&nbsp;×&nbsp;$180.00");
    expect(configurable.html).toContain("Tamaño: Mediano");
    expect(configurable.html).toContain("Sabor: Chocolate");
    expect(configurable.html).toContain("Decoración: Hoja de oro");
    expect(containsInternalId(multi.html + configurable.html)).toBe(false);
    expect(configurable.html).not.toContain("opt_");
  });

  it("keeps sandbox only on the subject", () => {
    const view = sampleOrderView("es-MX", "delivery");
    const rendered = renderTransactionalEmail({ template: "ORDER_OUT_FOR_DELIVERY", order: view });
    expect(applySandboxSubject("sandbox", getEmailSubject("ORDER_OUT_FOR_DELIVERY", "es-MX", view))).toBe(
      "[SANDBOX] Tu pedido va en camino",
    );
    expect(rendered.html).not.toContain("[SANDBOX]");
    expect(rendered.text).not.toContain("[SANDBOX]");
    expect(rendered.html).toContain("Ya salió de DELIVERSO");
    expect(rendered.html).not.toContain("<h1>Tu pedido va en camino</h1>\n                <p>Tu pedido va en camino.");
  });
});

describe("masking", () => {
  it("masks recipients for Admin lists", () => {
    expect(maskEmail("julio@gmail.com")).toBe("j***@gmail.com");
  });
});
