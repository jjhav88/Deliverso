export const customerAuthErrorCodes = [
  "AUTH_REQUIRED",
  "DATABASE_UNAVAILABLE",
  "CUSTOMER_NOT_FOUND",
] as const;

export type CustomerAuthErrorCode = (typeof customerAuthErrorCodes)[number];

export class CustomerAuthError extends Error {
  readonly code: CustomerAuthErrorCode;

  constructor(code: CustomerAuthErrorCode, message = code) {
    super(message);
    this.name = "CustomerAuthError";
    this.code = code;
  }
}

export function isCustomerAuthError(
  error: unknown,
  code?: CustomerAuthErrorCode,
): error is CustomerAuthError {
  if (!(error instanceof CustomerAuthError)) {
    return false;
  }
  return code ? error.code === code : true;
}

export function navigationCustomerFallback(error: unknown): "unavailable" | "rethrow" {
  if (isCustomerAuthError(error, "DATABASE_UNAVAILABLE")) {
    return "unavailable";
  }
  return "rethrow";
}
