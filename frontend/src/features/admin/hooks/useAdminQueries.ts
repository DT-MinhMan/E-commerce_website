import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCategory,
  createAdminProduct,
  getAdminDashboardSummary,
  getAdminOrder,
  getAdminProduct,
  listAdminCategories,
  listAdminOrders,
  listAdminProducts,
  updateAdminOrderStatus,
  updateAdminCategory,
  updateAdminProduct,
  updateAdminProductStatus,
  updateAdminProductStock,
  uploadAdminCategoryImage,
  uploadAdminProductImage
} from "../services/adminService.js";
import type { ApiError } from "../../../lib/apiClient.js";
import { queryStaleTimes } from "../../../lib/queryClient.js";
import type {
  AdminDashboardSummary,
  AdminOrderListParams,
  AdminOrderListResult,
  AdminProductListParams,
  AdminProductListResult,
  CategoryWriteInput,
  OrderStatus,
  ProductWriteInput
} from "../types.js";
import type { CatalogStatus, Category, Product } from "../../catalog/types.js";
import type { Order } from "../../orders/types.js";
import { cartKeys } from "../../cart/hooks/useCartQueries.js";
import { categoryKeys, productKeys } from "../../catalog/hooks/useCatalogQueries.js";
import { orderKeys } from "../../orders/hooks/useOrderQueries.js";

export const adminCategoryKeys = {
  all: ["admin", "categories"] as const,
  lists: () => [...adminCategoryKeys.all, "list"] as const
};

export const adminProductKeys = {
  all: ["admin", "products"] as const,
  lists: () => [...adminProductKeys.all, "list"] as const,
  list: (params: AdminProductListParams) => [...adminProductKeys.lists(), params] as const,
  detail: (id: string) => [...adminProductKeys.all, "detail", id] as const
};

export const adminOrderKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...adminOrderKeys.all, "list"] as const,
  list: (params: AdminOrderListParams) => [...adminOrderKeys.lists(), params] as const,
  detail: (id: string) => [...adminOrderKeys.all, "detail", id] as const
};

export const adminDashboardKeys = {
  summary: () => ["admin", "dashboard", "summary"] as const
};

export const useAdminCategoriesQuery = () =>
  useQuery<Category[], ApiError>({
    queryKey: adminCategoryKeys.lists(),
    queryFn: ({ signal }) => listAdminCategories(signal),
    staleTime: queryStaleTimes.categories
  });

export const useAdminProductsQuery = (params: AdminProductListParams) =>
  useQuery<AdminProductListResult, ApiError>({
    queryKey: adminProductKeys.list(params),
    queryFn: ({ signal }) => listAdminProducts(params, signal),
    staleTime: queryStaleTimes.adminLists
  });

export const useAdminProductDetailQuery = (productId: string) =>
  useQuery<Product, ApiError>({
    queryKey: adminProductKeys.detail(productId),
    queryFn: ({ signal }) => getAdminProduct(productId, signal),
    enabled: productId.length > 0,
    staleTime: queryStaleTimes.productDetail,
    retry: (failureCount, error) => (error.code === "PRODUCT_NOT_FOUND" ? false : failureCount < 1)
  });

export const useAdminOrdersQuery = (params: AdminOrderListParams) =>
  useQuery<AdminOrderListResult, ApiError>({
    queryKey: adminOrderKeys.list(params),
    queryFn: ({ signal }) => listAdminOrders(params, signal),
    staleTime: queryStaleTimes.adminLists
  });

export const useAdminOrderDetailQuery = (orderId: string) =>
  useQuery<Order, ApiError>({
    queryKey: adminOrderKeys.detail(orderId),
    queryFn: ({ signal }) => getAdminOrder(orderId, signal),
    enabled: orderId.length > 0,
    staleTime: queryStaleTimes.orders,
    retry: (failureCount, error) => (error.code === "ORDER_NOT_FOUND" ? false : failureCount < 1)
  });

export const useAdminDashboardSummaryQuery = () =>
  useQuery<AdminDashboardSummary, ApiError>({
    queryKey: adminDashboardKeys.summary(),
    queryFn: ({ signal }) => getAdminDashboardSummary(signal),
    staleTime: queryStaleTimes.adminDashboard
  });

const invalidateProductSurfaces = (queryClient: ReturnType<typeof useQueryClient>, product?: Product) => {
  queryClient.invalidateQueries({ queryKey: adminProductKeys.lists() });
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  queryClient.invalidateQueries({ queryKey: adminDashboardKeys.summary() });

  if (product) {
    queryClient.setQueryData(adminProductKeys.detail(product.id), product);
    queryClient.invalidateQueries({ queryKey: productKeys.detail(product.slug) });
  }
};

const invalidateCategorySurfaces = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all });
  queryClient.invalidateQueries({ queryKey: categoryKeys.all });
  queryClient.invalidateQueries({ queryKey: adminProductKeys.lists() });
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
  queryClient.invalidateQueries({ queryKey: adminDashboardKeys.summary() });
};

const upsertAdminCategoryCache = (queryClient: ReturnType<typeof useQueryClient>, category: Category) => {
  queryClient.setQueryData<Category[]>(adminCategoryKeys.lists(), (current) => {
    if (!current) {
      return [category];
    }

    const exists = current.some((item) => item.id === category.id);
    return exists ? current.map((item) => (item.id === category.id ? category : item)) : [category, ...current];
  });
};

export const useCreateAdminCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, CategoryWriteInput>({
    mutationFn: createAdminCategory,
    onSuccess: (category) => {
      upsertAdminCategoryCache(queryClient, category);
      invalidateCategorySurfaces(queryClient);
    }
  });
};

export const useUpdateAdminCategory = () => {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, { categoryId: string; input: CategoryWriteInput }>({
    mutationFn: ({ categoryId, input }) => updateAdminCategory(categoryId, input),
    onSuccess: (category) => {
      upsertAdminCategoryCache(queryClient, category);
      invalidateCategorySurfaces(queryClient);
    }
  });
};

export const useCreateAdminProduct = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, ProductWriteInput>({
    mutationFn: createAdminProduct,
    onSuccess: (product) => invalidateProductSurfaces(queryClient, product)
  });
};

export const useUpdateAdminProduct = (productId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, ProductWriteInput>({
    mutationFn: (input) => updateAdminProduct(productId, input),
    onSuccess: (product) => invalidateProductSurfaces(queryClient, product)
  });
};

export const useUploadAdminProductImage = () =>
  useMutation<{ url: string; publicId: string }, ApiError, { dataUri: string; fileName?: string }>({
    mutationFn: uploadAdminProductImage
  });

export const useUploadAdminCategoryImage = () =>
  useMutation<{ url: string; publicId: string }, ApiError, { dataUri: string; fileName?: string }>({
    mutationFn: uploadAdminCategoryImage
  });

export const useUpdateAdminProductStock = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, { productId: string; stockQuantity: number }>({
    mutationFn: ({ productId, stockQuantity }) => updateAdminProductStock(productId, stockQuantity),
    onSuccess: (product) => {
      invalidateProductSurfaces(queryClient, product);
      queryClient.invalidateQueries({ queryKey: cartKeys.current() });
    }
  });
};

export const useUpdateAdminProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, { productId: string; status: CatalogStatus }>({
    mutationFn: ({ productId, status }) => updateAdminProductStatus(productId, status),
    onSuccess: (product) => invalidateProductSurfaces(queryClient, product)
  });
};

export const useUpdateAdminOrderStatus = (orderId: string) => {
  const queryClient = useQueryClient();

  return useMutation<Order, ApiError, { nextStatus: OrderStatus; expectedCurrentStatus: OrderStatus }>({
    mutationFn: (input) => updateAdminOrderStatus(orderId, input),
    onSuccess: (order) => {
      queryClient.setQueryData(adminOrderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: adminOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(order.id) });
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.summary() });
    }
  });
};
