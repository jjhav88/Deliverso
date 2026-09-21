export type LogLevel = "info" | "warn" | "error";

export type LogFields = {
  event: string;
  requestId?: string;
  orderId?: string;
  outboxId?: string;
  status?: string;
  template?: string;
  providerMessageId?: string;
  eventId?: string;
  eventType?: string;
  paymentIntentId?: string;
  result?: string;
  job?: string;
  processed?: number;
  updated?: number;
  skipped?: number;
  failed?: number;
  code?: string | null;
};

const forbiddenKeys = /secret|password|authorization|cookie|token|phone|address|recipient|email|client_secret|api[_-]?key|service.?role|whsec_|sk_live_|sk_test_/i;

export function sanitizeLogFields(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (forbiddenKeys.test(key)) {
      continue;
    }
    if (typeof value === "string" && forbiddenKeys.test(value)) {
      continue;
    }
    output[key] = value;
  }
  return output;
}

export function createLogEntry(level: LogLevel, fields: LogFields): Record<string, unknown> {
  return sanitizeLogFields({
    level,
    timestamp: new Date().toISOString(),
    ...fields,
  });
}

export function logInfo(fields: LogFields): void {
  console.info(JSON.stringify(createLogEntry("info", fields)));
}

export function logWarn(fields: LogFields): void {
  console.warn(JSON.stringify(createLogEntry("warn", fields)));
}

export function logError(fields: LogFields): void {
  console.error(JSON.stringify(createLogEntry("error", fields)));
}
