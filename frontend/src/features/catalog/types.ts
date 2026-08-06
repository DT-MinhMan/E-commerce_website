export type CatalogStatus = "ACTIVE" | "INACTIVE";

export type ProductSort = "newest" | "price_asc" | "price_desc";

export type RoomType = "LIVING_ROOM" | "BEDROOM" | "DINING_ROOM" | "WORKING_ROOM" | "OUTDOOR" | "DECOR";

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  LIVING_ROOM: "Phòng khách",
  BEDROOM: "Phòng ngủ",
  DINING_ROOM: "Phòng ăn",
  WORKING_ROOM: "Phòng làm việc",
  OUTDOOR: "Ngoài trời",
  DECOR: "Trang trí & Đèn"
};

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
  roomType?: RoomType;
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
  roomType?: RoomType;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  q?: string;
}

export interface ProductListResult {
  products: Product[];
  meta: PaginationMeta;
}
