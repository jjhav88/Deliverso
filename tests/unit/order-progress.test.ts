import { describe, expect, it } from "vitest";
import { getOrderProgressState } from "@/modules/operations/domain/progress";

describe("customer order progress", () => {
  it("walks the delivery path", () => {
    const confirmed = getOrderProgressState({
      orderStatus: "PAID",
      fulfillmentStatus: "CONFIRMED",
      fulfillmentMethod: "DELIVERY",
    });
    expect(confirmed.steps.map((step) => step.id)).toEqual([
      "CONFIRMED",
      "IN_PRODUCTION",
      "READY",
      "OUT_FOR_DELIVERY",
      "COMPLETED",
    ]);
    expect(confirmed.currentIndex).toBe(0);
    expect(confirmed.cancelled).toBe(false);

    const out = getOrderProgressState({
      orderStatus: "PAID",
      fulfillmentStatus: "OUT_FOR_DELIVERY",
      fulfillmentMethod: "DELIVERY",
    });
    expect(out.currentIndex).toBe(3);
    expect(out.steps[3]?.label).toBe("En camino");

    const done = getOrderProgressState({
      orderStatus: "PAID",
      fulfillmentStatus: "COMPLETED",
      fulfillmentMethod: "DELIVERY",
    });
    expect(done.completed).toBe(true);
    expect(done.steps.at(-1)?.label).toBe("Entregado");
  });

  it("walks the pickup path without on the way", () => {
    const ready = getOrderProgressState({
      orderStatus: "PAID",
      fulfillmentStatus: "READY",
      fulfillmentMethod: "PICKUP",
    });
    expect(ready.steps.map((step) => step.id)).toEqual([
      "CONFIRMED",
      "IN_PRODUCTION",
      "READY",
      "COMPLETED",
    ]);
    expect(ready.currentIndex).toBe(2);
    expect(ready.steps[2]?.label).toBe("Listo para recoger");

    const done = getOrderProgressState({
      orderStatus: "PAID",
      fulfillmentStatus: "COMPLETED",
      fulfillmentMethod: "PICKUP",
    });
    expect(done.completed).toBe(true);
    expect(done.steps.at(-1)?.label).toBe("Recogido");
  });

  it("does not show active progression when cancelled", () => {
    const cancelled = getOrderProgressState({
      orderStatus: "CANCELLED",
      fulfillmentStatus: "CONFIRMED",
      fulfillmentMethod: "DELIVERY",
    });
    expect(cancelled.cancelled).toBe(true);
    expect(cancelled.inactive).toBe(true);
    expect(cancelled.currentIndex).toBe(-1);
  });

  it("treats paid pending fulfillment as the confirmed step", () => {
    const pending = getOrderProgressState({
      orderStatus: "PAID",
      fulfillmentStatus: "PENDING",
      fulfillmentMethod: "DELIVERY",
    });
    expect(pending.inactive).toBe(false);
    expect(pending.currentIndex).toBe(0);
  });
});
