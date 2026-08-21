import { apiClient } from "../../../lib/apiClient.js";
import type { CheckoutInput, Order, OrderListParams, OrderListResult } from "../types.js";

interface OrderResponse {
  success: true;
  data: {
    order: Order;
  };
  meta: unknown;
}

interface OrderListResponse {
  success: true;
  data: {
    orders: Order[];
  };
  meta: OrderListResult["meta"];
}

export const checkout = async (input: CheckoutInput): Promise<Order> => {
  const response = await apiClient.post<OrderResponse>("/orders/checkout", input);
  return response.data.data.order;
};

export const listOrders = async (params: OrderListParams, signal?: AbortSignal): Promise<OrderListResult> => {
  const response = await apiClient.get<OrderListResponse>("/orders", { params, signal });
  return {
    orders: response.data.data.orders,
    meta: response.data.meta
  };
};

export const getOrderById = async (orderId: string, signal?: AbortSignal): Promise<Order> => {
  const response = await apiClient.get<OrderResponse>(`/orders/${orderId}`, { signal });
  return response.data.data.order;
};

export const cancelOrder = async (orderId: string): Promise<Order> => {
  const response = await apiClient.post<OrderResponse>(`/orders/${orderId}/cancel`);
  return response.data.data.order;
};

