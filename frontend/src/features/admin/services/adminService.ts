import { apiClient } from "../../../lib/apiClient.js";
import type {
  AdminCategoryListResult,
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

interface CategoryListResponse {
  success: true;
  data: AdminCategoryListResult;
  meta: unknown;
}

interface CategoryResponse {
  success: true;
  data: { category: Category };
  meta: unknown;
}

interface ProductListResponse {
  success: true;
  data: { products: Product[] };
  meta: AdminProductListResult["meta"];
}

interface ProductResponse {
  success: true;
  data: { product: Product };
  meta: unknown;
}

interface ProductImageUploadResponse {
  success: true;
  data: { image: { url: string; publicId: string } };
  meta: unknown;
}

interface OrderListResponse {
  success: true;
  data: { orders: Order[] };
  meta: AdminOrderListResult["meta"];
}

interface OrderResponse {
  success: true;
  data: { order: Order };
  meta: unknown;
}

interface DashboardSummaryResponse {
  success: true;
  data: { summary: AdminDashboardSummary };
  meta: unknown;
}

const compactParams = (params: object): Record<string, string | number> =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== "")) as Record<string, string | number>;

export const listAdminCategories = async (signal?: AbortSignal): Promise<Category[]> => {
  const response = await apiClient.get<CategoryListResponse>("/admin/categories", { signal });
  return response.data.data.categories;
};

export const createAdminCategory = async (input: CategoryWriteInput): Promise<Category> => {
  const response = await apiClient.post<CategoryResponse>("/admin/categories", input);
  return response.data.data.category;
};

export const updateAdminCategory = async (categoryId: string, input: CategoryWriteInput): Promise<Category> => {
  const response = await apiClient.patch<CategoryResponse>(`/admin/categories/${categoryId}`, input);
  return response.data.data.category;
};

export const listAdminProducts = async (params: AdminProductListParams, signal?: AbortSignal): Promise<AdminProductListResult> => {
  const response = await apiClient.get<ProductListResponse>("/admin/products", {
    params: compactParams(params),
    signal
  });

  return { products: response.data.data.products, meta: response.data.meta };
};

export const getAdminProduct = async (productId: string, signal?: AbortSignal): Promise<Product> => {
  const response = await apiClient.get<ProductResponse>(`/admin/products/${productId}`, { signal });
  return response.data.data.product;
};

export const createAdminProduct = async (input: ProductWriteInput): Promise<Product> => {
  const response = await apiClient.post<ProductResponse>("/admin/products", input);
  return response.data.data.product;
};

export const updateAdminProduct = async (productId: string, input: ProductWriteInput): Promise<Product> => {
  const response = await apiClient.patch<ProductResponse>(`/admin/products/${productId}`, input);
  return response.data.data.product;
};

export const updateAdminProductStock = async (productId: string, stockQuantity: number): Promise<Product> => {
  const response = await apiClient.patch<ProductResponse>(`/admin/products/${productId}/stock`, { stockQuantity });
  return response.data.data.product;
};

export const updateAdminProductStatus = async (productId: string, status: CatalogStatus): Promise<Product> => {
  const response = await apiClient.patch<ProductResponse>(`/admin/products/${productId}/status`, { status });
  return response.data.data.product;
};

export const uploadAdminProductImage = async (input: { dataUri: string; fileName?: string }): Promise<{ url: string; publicId: string }> => {
  const response = await apiClient.post<ProductImageUploadResponse>("/admin/uploads/product-image", input, { timeout: 30000 });
  return response.data.data.image;
};

export const uploadAdminCategoryImage = async (input: { dataUri: string; fileName?: string }): Promise<{ url: string; publicId: string }> => {
  const response = await apiClient.post<ProductImageUploadResponse>("/admin/uploads/category-image", input, { timeout: 30000 });
  return response.data.data.image;
};

export const listAdminOrders = async (params: AdminOrderListParams, signal?: AbortSignal): Promise<AdminOrderListResult> => {
  const response = await apiClient.get<OrderListResponse>("/admin/orders", {
    params: compactParams(params),
    signal
  });

  return { orders: response.data.data.orders, meta: response.data.meta };
};

export const getAdminOrder = async (orderId: string, signal?: AbortSignal): Promise<Order> => {
  const response = await apiClient.get<OrderResponse>(`/admin/orders/${orderId}`, { signal });
  return response.data.data.order;
};

export const updateAdminOrderStatus = async (
  orderId: string,
  input: { nextStatus: OrderStatus; expectedCurrentStatus: OrderStatus }
): Promise<Order> => {
  const response = await apiClient.patch<OrderResponse>(`/admin/orders/${orderId}/status`, input);
  return response.data.data.order;
};

export const getAdminDashboardSummary = async (signal?: AbortSignal): Promise<AdminDashboardSummary> => {
  const response = await apiClient.get<DashboardSummaryResponse>("/admin/dashboard/summary", { signal });
  return response.data.data.summary;
};
