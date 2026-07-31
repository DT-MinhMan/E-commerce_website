import { useQuery } from "@tanstack/react-query";
import { getProductBySlug, listCategories, listProducts } from "../services/catalogService.js";
import type { ApiError } from "../services/apiClient.js";
import type { Category, Product, ProductListParams, ProductListResult } from "../types/catalog.js";

export const categoryKeys = {
  all: ["categories"] as const,
  active: () => [...categoryKeys.all, "active"] as const
};

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (slug: string) => [...productKeys.details(), slug] as const
};

export const useCategoriesQuery = () =>
  useQuery<Category[], ApiError>({
    queryKey: categoryKeys.active(),
    queryFn: ({ signal }) => listCategories(signal)
  });

export const useProductsQuery = (params: ProductListParams) =>
  useQuery<ProductListResult, ApiError>({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => listProducts(params, signal)
  });

export const useProductDetailQuery = (slug: string) =>
  useQuery<Product, ApiError>({
    queryKey: productKeys.detail(slug),
    queryFn: ({ signal }) => getProductBySlug(slug, signal),
    enabled: slug.length > 0,
    retry: (failureCount, error) => {
      const code = (error as { code?: string }).code;
      return code === "PRODUCT_NOT_FOUND" ? false : failureCount < 1;
    }
  });
