import type { CatalogStatus, Category, PaginationMeta, Product, ProductSort, RoomType } from "../catalog/types.js";
import type { Order } from "../orders/types.js";

export type ProductStockState = "in_stock" | "low_stock" | "out_of_stock";
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED"
  | "RETURNED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface AdminProductListParams {
  page: number;
  limit: number;
  sort: ProductSort;
  q?: string;
  category?: string;
  roomType?: RoomType;
  status?: CatalogStatus;
  stockState?: ProductStockState;
}

export interface AdminProductListResult {
  products: Product[];
  meta: PaginationMeta;
}

export interface ProductWriteInput {
  name: string;
  slug?: string;
  description: string;
  categoryId: string;
  roomType?: RoomType;
  priceMinor: number;
  currency?: string;
  stockQuantity: number;
  images?: Array<{ url: string; alt?: string; publicId?: string }>;
  status?: CatalogStatus;
}

export interface CategoryWriteInput {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  status?: CatalogStatus;
}

export interface AdminOrderListParams {
  page: number;
  limit: number;
  q?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
}

export interface AdminOrderListResult {
  orders: Order[];
  meta: PaginationMeta;
}

export interface AdminDashboardSummary {
  paidRevenueMinor: number;
  currency: string;
  totalOrders: number;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  lowStockProducts: Array<Pick<Product, "id" | "name" | "slug" | "stockQuantity" | "status">>;
  topProducts: Array<{
    productId: string;
    productName: string;
    soldQuantity: number;
    revenueMinor: number;
  }>;
}

export interface AdminCategoryListResult {
  categories: Category[];
}
