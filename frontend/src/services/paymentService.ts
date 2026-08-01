import { apiClient } from "./apiClient.js";
import type { CheckoutSessionInput, CheckoutSessionResult, PaymentStatus } from "../types/payment.js";

interface CheckoutSessionResponse {
  success: true;
  data: CheckoutSessionResult;
  meta: unknown;
}

interface PaymentStatusResponse {
  success: true;
  data: PaymentStatus;
  meta: unknown;
}

export const createCheckoutSession = async (input: CheckoutSessionInput): Promise<CheckoutSessionResult> => {
  const response = await apiClient.post<CheckoutSessionResponse>("/payments/checkout-session", input);
  return response.data.data;
};

export const getPaymentStatusByOrder = async (orderId: string, signal?: AbortSignal): Promise<PaymentStatus> => {
  const response = await apiClient.get<PaymentStatusResponse>(`/payments/orders/${orderId}`, { signal });
  return response.data.data;
};
