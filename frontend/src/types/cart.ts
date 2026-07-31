import type { ProductImage } from "./catalog.js";

export interface CartItem {
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

export interface Cart {
  id: string | null;
  items: CartItem[];
  itemCount: number;
  subtotalMinor: number;
  currency: string;
}

export interface AddCartItemInput {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  productId: string;
  quantity: number;
}
