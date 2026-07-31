import type { CategoryStatus, ProductStatus } from "../../database/enums.js";

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  status?: CategoryStatus;
}

export interface CategoryUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  status?: CategoryStatus;
}

export interface ProductImageInput {
  url: string;
  alt?: string;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  categoryId: string;
  priceMinor: number;
  currency?: string;
  stockQuantity: number;
  images?: ProductImageInput[];
  status?: ProductStatus;
}

export interface ProductUpdateInput {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  priceMinor?: number;
  currency?: string;
  stockQuantity?: number;
  images?: ProductImageInput[];
  status?: ProductStatus;
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface ProductListQuery extends PaginationQuery {
  category?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  sort: "newest" | "price_asc" | "price_desc";
  q?: string;
  status?: ProductStatus;
}

export interface CategoryListQuery {
  status?: CategoryStatus;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
