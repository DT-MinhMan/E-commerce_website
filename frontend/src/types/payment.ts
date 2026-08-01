export interface CheckoutSessionInput {
  orderId: string;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}

export interface PaymentStatus {
  payment: {
    orderId: string;
    status: string;
    amountMinor: number;
    currency: string;
    provider: string;
    providerCheckoutSessionId: string | null;
    providerPaymentId: string | null;
    paidAt: string | null;
    failureCode: string | null;
    failureMessage: string | null;
  };
  order: {
    id: string;
    orderStatus: string;
    paymentStatus: string;
    paidAt: string | null;
  };
}
