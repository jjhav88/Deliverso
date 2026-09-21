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
    throw new Error("email:test is forbidden in production");
  }
  const template = process.argv.includes("ORDER_PAID") ? "ORDER_PAID" : "CUSTOMER_WELCOME";
  const { queueTransactionalEmail } = await import("../../src/modules/email/queue");
  const { dispatchPendingEmails } = await import("../../src/modules/email/dispatcher");
  const { canSendDevTestEmail } = await import("../../src/modules/email/domain/mode");
  const mode = (process.env.EMAIL_MODE ?? "sandbox").toLowerCase();
  if (!canSendDevTestEmail({ mode: mode as "sandbox", nodeEnv: process.env.NODE_ENV })) {
    throw new Error("email:test requires EMAIL_MODE=sandbox outside production");
  }

  await queueTransactionalEmail({
    template,
    eventKey: `script-test:${template}:${Date.now()}`,
    recipientEmail: "preview@deliverso.local",
    recipientName: "Preview",
    locale: "es-MX",
    referenceType: "Preview",
    referenceId: "sample",
  });
  const summary = await dispatchPendingEmails();
  console.log("EMAIL_TEST_SUMMARY", { template, ...summary });
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "test failed";
  console.error("EMAIL_TEST_FAILED", message);
  process.exitCode = 1;
});
