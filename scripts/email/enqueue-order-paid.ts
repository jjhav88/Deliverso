import { createRequire } from "node:module";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: true });

const require = createRequire(import.meta.url);
const Module = require("module") as {
  _load: (request: string, parent: unknown, isMain: boolean) => unknown;
};
const originalLoad = Module._load.bind(Module);
Module._load = (request: string, parent: unknown, isMain: boolean) => {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("enqueueOrderPaidTestEmail is forbidden in production");
  }
  const orderNumber = process.argv[2];
  if (!orderNumber) {
    throw new Error("Usage: pnpm email:enqueue-paid DEL-...");
  }

  const { getPrisma } = await import("../../src/server/db/prisma");
  const { queueTransactionalEmail } = await import("../../src/modules/email/queue");
  const { orderPaidEventKey } = await import("../../src/modules/email/domain/event-keys");
  const order = await getPrisma().order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      status: true,
      customerEmail: true,
      customerName: true,
      locale: true,
    },
  });
  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  const result = await queueTransactionalEmail({
    template: "ORDER_PAID",
    eventKey: `${orderPaidEventKey(order.id)}:manual-test`,
    recipientEmail: order.customerEmail,
    recipientName: order.customerName,
    locale: order.locale || "es-MX",
    referenceType: "Order",
    referenceId: order.id,
  });
  console.log("EMAIL_ENQUEUE_PAID", {
    orderNumber,
    queued: result.queued,
    orderStatusUnchanged: order.status,
  });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "enqueue failed";
  console.error("EMAIL_ENQUEUE_FAILED", message);
  process.exitCode = 1;
});
