import type { ProductImage } from "../catalog/product.model.js";

export interface CartItemInput {
  productId: string;
  quantity: number;
}

export interface CartQuantityInput {
  quantity: number;
}

export interface CartItemResponse {
  productId: string;
  slug: string | null;
  name: string;
  image: ProductImage | null;
  unitPriceMinor: number;
  currency: string;
  quantity: number;
  lineTotalMinor: number;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface CartResponse {
  id: string | null;
  items: CartItemResponse[];
  itemCount: number;
  subtotalMinor: number;
  currency: string;
}
