import { apiClient } from "./apiClient.js";
import type { AddCartItemInput, Cart, UpdateCartItemInput } from "../types/cart.js";

interface CartResponse {
  success: true;
  data: {
    cart: Cart;
  };
  meta: unknown;
}

export const getCart = async (signal?: AbortSignal): Promise<Cart> => {
  const response = await apiClient.get<CartResponse>("/cart", { signal });
  return response.data.data.cart;
};

export const addCartItem = async (input: AddCartItemInput): Promise<Cart> => {
  const response = await apiClient.post<CartResponse>("/cart/items", input);
  return response.data.data.cart;
};

export const updateCartItem = async (input: UpdateCartItemInput): Promise<Cart> => {
  const response = await apiClient.patch<CartResponse>(`/cart/items/${input.productId}`, { quantity: input.quantity });
  return response.data.data.cart;
};

export const removeCartItem = async (productId: string): Promise<Cart> => {
  const response = await apiClient.delete<CartResponse>(`/cart/items/${productId}`);
  return response.data.data.cart;
};

export const clearCart = async (): Promise<Cart> => {
  const response = await apiClient.delete<CartResponse>("/cart");
  return response.data.data.cart;
};
