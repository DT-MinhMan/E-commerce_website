import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { DEFAULT_CURRENCY, ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "../../database/enums.js";
import { isCurrencyCode, isNonNegativeInteger, isPositiveInteger } from "../../database/validators.js";

export interface OrderItem {
  productId: Types.ObjectId;
  productName: string;
  productSlug: string;
  productImage?: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  countryCode: string;
}

export interface Order {
  orderNumber: string;
  userId: Types.ObjectId;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  subtotalMinor: number;
  shippingFeeMinor: number;
  totalMinor: number;
  currency: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  cancelledAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<Order>;

const orderItemSchema = new Schema<OrderItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    productSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200
    },
    productImage: {
      type: String,
      trim: true,
      maxlength: 2048
    },
    unitPriceMinor: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: "unitPriceMinor must be a non-negative integer" }
    },
    quantity: {
      type: Number,
      required: true,
      validate: { validator: isPositiveInteger, message: "quantity must be a positive integer" }
    },
    lineTotalMinor: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: "lineTotalMinor must be a non-negative integer" }
    }
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<ShippingAddress>(
  {
    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 200
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    stateOrProvince: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 32
    },
    countryCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 2,
      maxlength: 2
    }
  },
  { _id: false }
);

const orderSchema = new Schema<Order>(
  {
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 40
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (items: OrderItem[]) => items.length > 0,
        message: "order must contain at least one item"
      }
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    subtotalMinor: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: "subtotalMinor must be a non-negative integer" }
    },
    shippingFeeMinor: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: "shippingFeeMinor must be a non-negative integer" }
    },
    totalMinor: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: "totalMinor must be a non-negative integer" }
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: DEFAULT_CURRENCY,
      validate: { validator: isCurrencyCode, message: "currency must be an ISO-style code" }
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
      default: "PENDING_PAYMENT"
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: "PENDING"
    },
    paidAt: Date,
    cancelledAt: Date,
    completedAt: Date
  },
  {
    collection: "orders",
    timestamps: true
  }
);

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });

export const OrderModel = model<Order>("Order", orderSchema);
