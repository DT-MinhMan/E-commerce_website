import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { DEFAULT_CURRENCY, PRODUCT_STATUSES, ROOM_TYPES, type ProductStatus, type RoomType } from "../../database/enums.js";
import { isCurrencyCode, isNonNegativeInteger, isSlug } from "../../database/validators.js";

export interface ProductImage {
  url: string;
  alt?: string;
  publicId?: string;
}

export interface Product {
  name: string;
  slug: string;
  description: string;
  categoryId: Types.ObjectId;
  roomType?: RoomType;
  priceMinor: number;
  currency: string;
  stockQuantity: number;
  images: ProductImage[];
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;

const productImageSchema = new Schema<ProductImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048
    },
    alt: {
      type: String,
      trim: true,
      maxlength: 160
    },
    publicId: {
      type: String,
      trim: true,
      maxlength: 255
    }
  },
  { _id: false }
);

const productSchema = new Schema<Product>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
      validate: { validator: isSlug, message: "Invalid slug format" }
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 3000
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    priceMinor: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: "priceMinor must be a non-negative integer" }
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: DEFAULT_CURRENCY,
      validate: { validator: isCurrencyCode, message: "currency must be an ISO-style code" }
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      validate: { validator: isNonNegativeInteger, message: "stockQuantity must be a non-negative integer" }
    },
    images: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator: (images: ProductImage[]) => images.length <= 8,
        message: "products can have at most 8 images"
      }
    },
    status: {
      type: String,
      enum: PRODUCT_STATUSES,
      required: true,
      default: "ACTIVE"
    },
    roomType: {
      type: String,
      enum: ROOM_TYPES,
      required: false
    }
  },
  {
    collection: "products",
    timestamps: true
  }
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ categoryId: 1, status: 1 });
productSchema.index({ roomType: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ stockQuantity: 1, updatedAt: -1 });
productSchema.index({ name: "text", description: "text" });

export const ProductModel = model<Product>("Product", productSchema);
