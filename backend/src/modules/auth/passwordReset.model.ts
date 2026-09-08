import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface PasswordReset {
  userId: Types.ObjectId;
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

const passwordResetSchema = new Schema<PasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    codeHash: {
      type: String,
      required: true,
      trim: true
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    collection: "password_resets",
    timestamps: true
  }
);

passwordResetSchema.index({ email: 1 }, { unique: true });
passwordResetSchema.index({ userId: 1 });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetModel = model<PasswordReset>("PasswordReset", passwordResetSchema);
