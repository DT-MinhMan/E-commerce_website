import type { OrderStatus, PaymentStatus } from "../../database/enums.js";
import type { ProductImage } from "../catalog/product.model.js";

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

export interface OrderListQuery {
  page: number;
  limit: number;
}

export interface OrderItemResponse {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: ProductImage | null;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface ShippingAddressResponse {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  countryCode: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  items: OrderItemResponse[];
  shippingAddress: ShippingAddressResponse;
  subtotalMinor: number;
  shippingFeeMinor: number;
  totalMinor: number;
  currency: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
