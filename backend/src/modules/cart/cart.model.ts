import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { isPositiveInteger } from "../../database/validators.js";

export interface CartItem {
  productId: Types.ObjectId;
  quantity: number;
}

export interface Cart {
  userId: Types.ObjectId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<Cart>;

const cartItemSchema = new Schema<CartItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      validate: { validator: isPositiveInteger, message: "quantity must be a positive integer" }
    }
  },
  { _id: false }
);

const cartSchema = new Schema<Cart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (items: CartItem[]) => {
          const productIds = items.map((item) => item.productId.toString());
          return new Set(productIds).size === productIds.length;
        },
        message: "cart cannot contain duplicate products"
      }
    }
  },
  {
    collection: "carts",
    timestamps: true
  }
);

cartSchema.index({ userId: 1 }, { unique: true });

export const CartModel = model<Cart>("Cart", cartSchema);
