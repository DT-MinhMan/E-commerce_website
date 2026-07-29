import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface RefreshToken {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedByTokenId?: Types.ObjectId;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

const refreshTokenSchema = new Schema<RefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    tokenHash: {
      type: String,
      required: true,
      trim: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: Date,
    replacedByTokenId: {
      type: Schema.Types.ObjectId,
      ref: "RefreshToken"
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 512
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 64
    }
  },
  {
    collection: "refresh_tokens",
    timestamps: true
  }
);

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenSchema.index({ userId: 1, expiresAt: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model<RefreshToken>("RefreshToken", refreshTokenSchema);
