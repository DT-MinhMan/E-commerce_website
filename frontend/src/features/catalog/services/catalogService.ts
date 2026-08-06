import { apiClient } from "../../../lib/apiClient.js";
import type { Category, Product, ProductListParams, ProductListResult } from "../types.js";

interface CategoryListResponse {
  success: true;
  data: {
    categories: Category[];
  };
  meta: unknown;
}

interface ProductListResponse {
  success: true;
  data: {
    products: Product[];
  };
  meta: ProductListResult["meta"];
}

interface ProductDetailResponse {
  success: true;
  data: {
    product: Product;
  };
  meta: unknown;
}

const toRequestParams = (params: ProductListParams): Record<string, string | number> => ({
  page: params.page,
  limit: params.limit,
  sort: params.sort,
  ...(params.category ? { category: params.category } : {}),
  ...(params.roomType ? { roomType: params.roomType } : {}),
  ...(params.q ? { q: params.q } : {}),
  ...(params.minPriceMinor !== undefined ? { minPriceMinor: params.minPriceMinor } : {}),
  ...(params.maxPriceMinor !== undefined ? { maxPriceMinor: params.maxPriceMinor } : {})
});

export const listCategories = async (signal?: AbortSignal): Promise<Category[]> => {
  const response = await apiClient.get<CategoryListResponse>("/categories", { signal });
  return response.data.data.categories;
};

export const listProducts = async (params: ProductListParams, signal?: AbortSignal): Promise<ProductListResult> => {
  const response = await apiClient.get<ProductListResponse>("/products", {
    params: toRequestParams(params),
    signal
  });

  return {
    products: response.data.data.products,
    meta: response.data.meta
  };
};

export const getProductBySlug = async (slug: string, signal?: AbortSignal): Promise<Product> => {
  const response = await apiClient.get<ProductDetailResponse>(`/products/${slug}`, { signal });
  return response.data.data.product;
};
