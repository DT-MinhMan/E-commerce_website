import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface EmailVerification {
  userId: Types.ObjectId;
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

const emailVerificationSchema = new Schema<EmailVerification>(
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
    collection: "email_verifications",
    timestamps: true
  }
);

emailVerificationSchema.index({ email: 1 }, { unique: true });
emailVerificationSchema.index({ userId: 1 });
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationModel = model<EmailVerification>("EmailVerification", emailVerificationSchema);
