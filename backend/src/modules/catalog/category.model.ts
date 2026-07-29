import { Schema, model, type HydratedDocument } from "mongoose";
import { CATEGORY_STATUSES, type CategoryStatus } from "../../database/enums.js";
import { isSlug } from "../../database/validators.js";

export interface Category {
  name: string;
  slug: string;
  description?: string;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<Category>;

const categorySchema = new Schema<Category>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 160,
      validate: { validator: isSlug, message: "Invalid slug format" }
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500
    },
    status: {
      type: String,
      enum: CATEGORY_STATUSES,
      required: true,
      default: "ACTIVE"
    }
  },
  {
    collection: "categories",
    timestamps: true
  }
);

categorySchema.index({ slug: 1 }, { unique: true });

export const CategoryModel = model<Category>("Category", categorySchema);
