import { canAccessCustomerOrder } from "@/modules/orders/domain/ownership";
import { canRetryCardPayment } from "@/modules/orders/domain/payment-status";

export const CONFIRMATION_POLL_INTERVAL_MS = 2000;
export const CONFIRMATION_POLL_TIMEOUT_MS = 30_000;

export const confirmationPhases = [
  "paid",
  "failed",
  "verifying",
  "delayed",
  "syncing",
] as const;

export type ConfirmationPhase = (typeof confirmationPhases)[number];

export type ConfirmationStatusSnapshot = {
  orderStatus: string;
  paymentStatus: string;
};

export type ConfirmationStatusResult =
  | { ok: true; orderStatus: string; paymentStatus: string }
  | { ok: false; reason: "not_found" };

export type ConfirmationSearchParams = {
  redirect_status?: string | string[];
  payment_intent?: string | string[];
  payment_intent_client_secret?: string | string[];
};

export function isConfirmedByDatabase(orderStatus: string, paymentStatus: string): boolean {
  return orderStatus === "PAID" && paymentStatus === "SUCCEEDED";
}

export function paymentAuthorityFromSearchParams(
  searchParams?: ConfirmationSearchParams,
): ConfirmationStatusSnapshot {
  void searchParams;
  return { orderStatus: "", paymentStatus: "" };
}

export function resolveConfirmationPhase(input: {
  orderStatus: string;
  paymentStatus: string;
  stripeIntentStatus?: string | null;
  elapsedMs: number;
  timeoutMs?: number;
  searchParams?: ConfirmationSearchParams;
}): ConfirmationPhase {
  void input.searchParams;
  if (isConfirmedByDatabase(input.orderStatus, input.paymentStatus)) {
    return "paid";
  }
  if (input.paymentStatus === "FAILED") {
    return "failed";
  }

  const timeoutMs = input.timeoutMs ?? CONFIRMATION_POLL_TIMEOUT_MS;
  const timedOut = input.elapsedMs >= timeoutMs;

  if (input.stripeIntentStatus === "succeeded") {
    return timedOut ? "delayed" : "syncing";
  }

  return timedOut ? "delayed" : "verifying";
}

export function shouldPollConfirmation(phase: ConfirmationPhase): boolean {
  return phase === "verifying" || phase === "syncing";
}

export function shouldShowPaymentRetry(input: {
  phase: ConfirmationPhase;
  stripeIntentStatus?: string | null;
}): boolean {
  return input.phase === "failed" && canRetryCardPayment(input.stripeIntentStatus ?? "");
}

export function toOwnedOrderPaymentStatusResult(input: {
  customerId: string;
  order: { customerId: string; status: string; paymentStatus: string } | null;
}): ConfirmationStatusResult {
  if (
    !input.order ||
    !canAccessCustomerOrder({
      orderCustomerId: input.order.customerId,
      customerId: input.customerId,
    })
  ) {
    return { ok: false, reason: "not_found" };
  }

  return {
    ok: true,
    orderStatus: input.order.status,
    paymentStatus: input.order.paymentStatus,
  };
}
