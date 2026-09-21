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
  const { dispatchPendingEmails } = await import("../../src/modules/email/dispatcher");
  const summary = await dispatchPendingEmails();
  console.log("EMAIL_DISPATCH_SUMMARY", summary);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "dispatch failed";
  console.error("EMAIL_DISPATCH_FAILED", message);
  process.exitCode = 1;
});
