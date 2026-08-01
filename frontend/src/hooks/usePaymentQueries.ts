import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCheckoutSession, getPaymentStatusByOrder } from "../services/paymentService.js";
import type { ApiError } from "../services/apiClient.js";
import { useAuthStore } from "../store/authStore.js";
import type { CheckoutSessionInput, CheckoutSessionResult, PaymentStatus } from "../types/payment.js";
import { orderKeys } from "./useOrderQueries.js";

const terminalPaymentStatuses = new Set(["SUCCEEDED", "FAILED", "REFUNDED"]);
const terminalOrderStatuses = new Set(["PAID", "CANCELLED", "COMPLETED", "REFUNDED", "PAYMENT_REVIEW"]);

export const paymentKeys = {
  all: ["payments"] as const,
  byOrder: (orderId: string) => [...paymentKeys.all, "order", orderId] as const
};

export const isPaymentPollingTerminal = (status: PaymentStatus): boolean =>
  terminalPaymentStatuses.has(status.payment.status) || terminalOrderStatuses.has(status.order.orderStatus);

export const usePaymentStatusByOrderQuery = (orderId: string, options: { poll?: boolean; timedOut?: boolean } = {}) => {
  const status = useAuthStore((state) => state.status);

  return useQuery<PaymentStatus, ApiError>({
    queryKey: paymentKeys.byOrder(orderId),
    queryFn: ({ signal }) => getPaymentStatusByOrder(orderId, signal),
    enabled: status === "authenticated" && orderId.length > 0,
    refetchInterval: (query) => {
      if (!options.poll || options.timedOut || !query.state.data) {
        return false;
      }

      return isPaymentPollingTerminal(query.state.data) ? false : 2500;
    },
    retry: (failureCount, error) => (error.code === "ORDER_NOT_FOUND" || error.code === "PAYMENT_NOT_FOUND" ? false : failureCount < 1)
  });
};

export const useCreateCheckoutSession = () => {
  const queryClient = useQueryClient();

  return useMutation<CheckoutSessionResult, ApiError, CheckoutSessionInput>({
    mutationFn: createCheckoutSession,
    onSuccess: (session, input) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.byOrder(input.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(input.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      window.location.assign(session.checkoutUrl);
    }
  });
};
