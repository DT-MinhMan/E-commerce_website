import type { ProductImage } from "./catalog.js";

export interface ShippingAddressInput {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  countryCode: string;
}

export interface CheckoutInput {
  shippingAddress: ShippingAddressInput;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: ProductImage | null;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddressInput;
  subtotalMinor: number;
  shippingFeeMinor: number;
  totalMinor: number;
  currency: string;
  orderStatus: string;
  paymentStatus: string;
  paidAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListParams {
  page: number;
  limit: number;
}

export interface OrderListResult {
  orders: Order[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
