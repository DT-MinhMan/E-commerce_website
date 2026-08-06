import { QueryClient } from "@tanstack/react-query";

export const queryStaleTimes = {
  health: 15_000,
  categories: 10 * 60_000,
  products: 60_000,
  productDetail: 2 * 60_000,
  cart: 5_000,
  orders: 15_000,
  payment: 2_500,
  adminLists: 20_000,
  adminDashboard: 10_000,
  currentUser: 60_000
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: false
    }
  }
});
