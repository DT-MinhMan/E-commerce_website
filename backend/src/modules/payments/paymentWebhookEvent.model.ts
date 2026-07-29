import { Schema, model, type HydratedDocument } from "mongoose";
import {
  PAYMENT_PROVIDERS,
  WEBHOOK_PROCESSING_STATUSES,
  type PaymentProvider,
  type WebhookProcessingStatus
} from "../../database/enums.js";
import { isNonNegativeInteger } from "../../database/validators.js";

export interface PaymentWebhookEvent {
  provider: PaymentProvider;
  providerEventId: string;
  eventType: string;
  payload: unknown;
  processingStatus: WebhookProcessingStatus;
  processedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentWebhookEventDocument = HydratedDocument<PaymentWebhookEvent>;

const paymentWebhookEventSchema = new Schema<PaymentWebhookEvent>(
  {
    provider: {
      type: String,
      enum: PAYMENT_PROVIDERS,
      required: true,
      default: "STRIPE"
    },
    providerEventId: {
      type: String,
      required: true,
      trim: true,
      immutable: true
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true
    },
    processingStatus: {
      type: String,
      enum: WEBHOOK_PROCESSING_STATUSES,
      required: true,
      default: "RECEIVED"
    },
    processedAt: Date,
    errorMessage: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    retryCount: {
      type: Number,
      required: true,
      default: 0,
      validate: { validator: isNonNegativeInteger, message: "retryCount must be a non-negative integer" }
    }
  },
  {
    collection: "payment_webhook_events",
    timestamps: true
  }
);

paymentWebhookEventSchema.index({ providerEventId: 1 }, { unique: true });
paymentWebhookEventSchema.index({ processingStatus: 1, createdAt: -1 });

export const PaymentWebhookEventModel = model<PaymentWebhookEvent>("PaymentWebhookEvent", paymentWebhookEventSchema);
