import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addCartItem, clearCart, getCart, removeCartItem, updateCartItem } from "../services/cartService.js";
import type { ApiError } from "../../../lib/apiClient.js";
import { useAuthStore } from "../../auth/store/authStore.js";
import type { AddCartItemInput, Cart, UpdateCartItemInput } from "../types.js";

export const cartKeys = {
  all: ["cart"] as const,
  current: () => [...cartKeys.all, "current"] as const
};

export const useCartQuery = () => {
  const status = useAuthStore((state) => state.status);

  return useQuery<Cart, ApiError>({
    queryKey: cartKeys.current(),
    queryFn: ({ signal }) => getCart(signal),
    enabled: status === "authenticated",
    retry: (failureCount, error) => {
      if (error.code === "AUTH_TOKEN_MISSING" || error.code === "AUTH_ACCESS_TOKEN_INVALID" || error.code === "AUTH_FORBIDDEN") {
        return false;
      }

      return failureCount < 1;
    }
  });
};

const useCartMutationOptions = () => {
  const queryClient = useQueryClient();

  return {
    onSuccess: (cart: Cart) => {
      queryClient.setQueryData(cartKeys.current(), cart);
    }
  };
};

export const useAddCartItem = () => {
  const options = useCartMutationOptions();
  return useMutation<Cart, ApiError, AddCartItemInput>({
    mutationFn: addCartItem,
    ...options
  });
};

export const useUpdateCartItem = () => {
  const options = useCartMutationOptions();
  return useMutation<Cart, ApiError, UpdateCartItemInput>({
    mutationFn: updateCartItem,
    ...options
  });
};

export const useRemoveCartItem = () => {
  const options = useCartMutationOptions();
  return useMutation<Cart, ApiError, string>({
    mutationFn: removeCartItem,
    ...options
  });
};

export const useClearCart = () => {
  const options = useCartMutationOptions();
  return useMutation<Cart, ApiError>({
    mutationFn: clearCart,
    ...options
  });
};
