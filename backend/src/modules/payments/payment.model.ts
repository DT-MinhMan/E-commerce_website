import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { DEFAULT_CURRENCY, PAYMENT_PROVIDERS, PAYMENT_STATUSES, type PaymentProvider, type PaymentStatus } from "../../database/enums.js";
import { isCurrencyCode, isNonNegativeInteger } from "../../database/validators.js";

export interface Payment {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerCheckoutSessionId?: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  failureCode?: string;
  failureMessage?: string;
  paidAt?: Date;
  refundedAt?: Date;
  metadata?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<Payment>;

const paymentSchema = new Schema<Payment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    provider: {
      type: String,
      enum: PAYMENT_PROVIDERS,
      required: true,
      default: "STRIPE"
    },
    providerPaymentId: {
      type: String,
      trim: true
    },
    providerCheckoutSessionId: {
      type: String,
      trim: true
    },
    amountMinor: {
      type: Number,
      required: true,
      validate: { validator: isNonNegativeInteger, message: "amountMinor must be a non-negative integer" }
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: DEFAULT_CURRENCY,
      validate: { validator: isCurrencyCode, message: "currency must be an ISO-style code" }
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      required: true,
      default: "PENDING"
    },
    failureCode: {
      type: String,
      trim: true,
      maxlength: 120
    },
    failureMessage: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    paidAt: Date,
    refundedAt: Date,
    metadata: {
      type: Map,
      of: String
    }
  },
  {
    collection: "payments",
    timestamps: true
  }
);

paymentSchema.index({ orderId: 1 }, { unique: true });
paymentSchema.index(
  { providerPaymentId: 1 },
  { unique: true, partialFilterExpression: { providerPaymentId: { $type: "string" } } }
);
paymentSchema.index(
  { providerCheckoutSessionId: 1 },
  { unique: true, partialFilterExpression: { providerCheckoutSessionId: { $type: "string" } } }
);
paymentSchema.index({ status: 1, createdAt: -1 });

export const PaymentModel = model<Payment>("Payment", paymentSchema);
