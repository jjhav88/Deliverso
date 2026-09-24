export type StripePaymentIntentSnapshot = {
  id: string;
  clientSecret: string | null;
  status: string;
  amount: number;
  currency: string;
  livemode: boolean;
  metadata?: {
    orderId?: string;
    orderNumber?: string;
  };
};

export type CreatePaymentIntentInput = {
  amountMinor: number;
  currency: "mxn";
  metadata: {
    orderId: string;
    orderNumber: string;
    customerId?: string;
  };
};

export type StripeRefundSnapshot = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paymentIntentId: string | null;
  livemode: boolean;
};

export type CreateStripeRefundInput = {
  paymentIntentId: string;
  amountMinor: number;
  metadata: {
    refundId: string;
    orderId: string;
  };
};

export type StripeGateway = {
  createPaymentIntent(
    input: CreatePaymentIntentInput,
    idempotencyKey: string,
  ): Promise<StripePaymentIntentSnapshot>;
  retrievePaymentIntent(id: string): Promise<StripePaymentIntentSnapshot>;
  cancelPaymentIntent(id: string): Promise<StripePaymentIntentSnapshot | null>;
  createRefund(
    input: CreateStripeRefundInput,
    idempotencyKey: string,
  ): Promise<StripeRefundSnapshot>;
  retrieveRefund(id: string): Promise<StripeRefundSnapshot>;
  constructWebhookEvent(rawBody: string, signature: string): unknown;
};
