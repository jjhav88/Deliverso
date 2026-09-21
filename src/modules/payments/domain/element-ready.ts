import {
  canInitializePaymentElement,
  sanitizeStripeFailureMessage,
} from "@/modules/orders/domain/payment-status";
import { paymentAuthorityFromSearchParams } from "@/modules/orders/domain/confirmation";

export type PaymentElementSubmitInput = {
  stripeReady: boolean;
  elementsReady: boolean;
  paymentElementReady: boolean;
  submitting: boolean;
  paymentIntentStatus: string;
  searchParams?: {
    redirect_status?: string | string[];
    payment_intent?: string | string[];
  };
};

export function canSubmitPaymentElement(input: PaymentElementSubmitInput): boolean {
  void paymentAuthorityFromSearchParams(input.searchParams);
  return (
    input.stripeReady &&
    input.elementsReady &&
    input.paymentElementReady &&
    !input.submitting &&
    canInitializePaymentElement(input.paymentIntentStatus)
  );
}

export function paymentButtonLabel(input: {
  paymentElementReady: boolean;
  submitting: boolean;
  payLabel: string;
  loadingLabel: string;
  processingLabel: string;
}): string {
  if (input.submitting) {
    return input.processingLabel;
  }
  if (!input.paymentElementReady) {
    return input.loadingLabel;
  }
  return input.payLabel;
}

export function shouldMountPaymentElement(status: string): boolean {
  return canInitializePaymentElement(status);
}

export function nextReadyStateAfterPaymentError(currentReady: boolean): boolean {
  return currentReady;
}

export function shouldKeepPaymentElementMountedAfterDecline(input: {
  paymentElementReady: boolean;
  paymentIntentStatus: string;
}): boolean {
  return input.paymentElementReady && canInitializePaymentElement(input.paymentIntentStatus);
}

export function shouldRemountPaymentElements(input: {
  previousClientSecret: string;
  nextClientSecret: string;
  loading?: boolean;
  submitting?: boolean;
  pollTick?: number;
}): boolean {
  void input.loading;
  void input.submitting;
  void input.pollTick;
  return input.previousClientSecret !== input.nextClientSecret;
}

export function safeStripeElementErrorLog(error: {
  type?: string;
  code?: string;
  message?: string;
} | undefined) {
  return {
    type: error?.type ?? null,
    code: error?.code ?? null,
    message: error?.message ?? null,
  };
}

export function paymentDeclineMessage(input: {
  stripeMessage?: string | null;
  fallback: string;
}): string {
  return sanitizeStripeFailureMessage(input.stripeMessage) ?? input.fallback;
}

export function createPaymentSubmitGuard() {
  let inFlight = false;
  return {
    tryStart() {
      if (inFlight) {
        return false;
      }
      inFlight = true;
      return true;
    },
    finish() {
      inFlight = false;
    },
  };
}
