export const transientDatabaseCodes = new Set([
  "08006",
  "08001",
  "08004",
  "57P01",
  "EAUTHTIMEOUT",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "ENOTFOUND",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2024",
]);

export function isTransientDatabaseError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as {
    code?: string;
    name?: string;
    message?: string;
    meta?: { code?: string };
    cause?: unknown;
  };
  const codes = [err.code, err.meta?.code].filter((code): code is string => Boolean(code));
  if (codes.some((code) => transientDatabaseCodes.has(code))) {
    return true;
  }

  if (
    typeof err.message === "string" &&
    /EAUTHTIMEOUT|timeout while waiting for message|Can't reach database|Connection terminated|connection reset|pool|the database system is not accepting connections|remaining connection slots|too many clients/i.test(
      err.message,
    )
  ) {
    return true;
  }

  return err.cause ? isTransientDatabaseError(err.cause) : false;
}

export function publicDatabaseError(error: unknown): { code: string | null; name: string } {
  if (!error || typeof error !== "object") {
    return { code: null, name: "Error" };
  }
  const err = error as { code?: string; name?: string; meta?: { code?: string } };
  return {
    name: err.name ?? "Error",
    code: err.code ?? err.meta?.code ?? null,
  };
}
