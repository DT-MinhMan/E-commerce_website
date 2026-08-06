import type { CategoryStatus, ProductStatus, RoomType } from "../../database/enums.js";

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
  publicId?: string;
}

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  categoryId: string;
  roomType?: RoomType;
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
  roomType?: RoomType;
  priceMinor?: number;
  currency?: string;
  stockQuantity?: number;
  images?: ProductImageInput[];
  status?: ProductStatus;
}

export interface ProductStockUpdateInput {
  stockQuantity: number;
}

export interface ProductStatusUpdateInput {
  status: ProductStatus;
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

export interface ProductListQuery extends PaginationQuery {
  category?: string;
  roomType?: RoomType;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  sort: "newest" | "price_asc" | "price_desc";
  q?: string;
  status?: ProductStatus;
  stockState?: "in_stock" | "low_stock" | "out_of_stock";
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
