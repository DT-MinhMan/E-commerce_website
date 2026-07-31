export type CatalogStatus = "ACTIVE" | "INACTIVE";

export type ProductSort = "newest" | "price_asc" | "price_desc";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  url: string;
  alt?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  priceMinor: number;
  currency: string;
  stockQuantity: number;
  images: ProductImage[];
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ProductListParams {
  page: number;
  limit: number;
  sort: ProductSort;
  category?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  q?: string;
}

export interface ProductListResult {
  products: Product[];
  meta: PaginationMeta;
}
