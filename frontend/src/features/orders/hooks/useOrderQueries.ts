import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, checkout, getOrderById, listOrders } from "../services/orderService.js";
import type { ApiError } from "../../../lib/apiClient.js";
import { useAuthStore } from "../../auth/store/authStore.js";
import type { CheckoutInput, Order, OrderListParams, OrderListResult } from "../types.js";
import { cartKeys } from "../../cart/hooks/useCartQueries.js";


export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: OrderListParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (orderId: string) => [...orderKeys.details(), orderId] as const
};

export const useOrdersQuery = (params: OrderListParams) => {
  const status = useAuthStore((state) => state.status);

  return useQuery<OrderListResult, ApiError>({
    queryKey: orderKeys.list(params),
    queryFn: ({ signal }) => listOrders(params, signal),
    enabled: status === "authenticated"
  });
};

export const useOrderDetailQuery = (orderId: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery<Order, ApiError>({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => getOrderById(orderId, signal),
    enabled: status === "authenticated" && orderId.length > 0,
    retry: (failureCount, error) => (error.code === "ORDER_NOT_FOUND" ? false : failureCount < 1)
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();

  return useMutation<Order, ApiError, CheckoutInput>({
    mutationFn: checkout,
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    }
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation<Order, ApiError, string>({
    mutationFn: cancelOrder,
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    }
  });
};

