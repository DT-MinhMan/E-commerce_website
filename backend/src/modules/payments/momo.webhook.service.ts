import mongoose, { Types } from "mongoose";
import crypto from "crypto";
import { AppError } from "../../common/errors/AppError.js";
import { logger, type LogFields } from "../../common/logger.js";
import { getConfig, type AppConfig } from "../../config/env.js";
import { ProductModel } from "../catalog/product.model.js";
import { OrderModel, type Order } from "../orders/order.model.js";
import { PaymentModel } from "./payment.model.js";
import { PaymentWebhookEventModel } from "./paymentWebhookEvent.model.js";

type WebhookOutcome = "PROCESSED" | "IGNORED" | "FAILED";
type LocalOrder = Order & { _id: Types.ObjectId };
type OrderItem = LocalOrder["items"][number];

interface StockRequest {
  productId: Types.ObjectId;
  quantity: number;
}

export interface MomoWebhookPayload {
  partnerCode?: string;
  orderId?: string;
  requestId?: string;
  amount?: number | string;
  orderInfo?: string;
  transId?: number | string;
  resultCode?: number;
  message?: string;
  payType?: string;
  responseTime?: number | string;
  extraData?: string;
  signature?: string;
  [key: string]: unknown;
}

const verifyMomoSignature = (body: MomoWebhookPayload, config: AppConfig): boolean => {
  const { momoAccessKey, momoSecretKey } = config;
  if (!momoAccessKey || !momoSecretKey) {
    throw new AppError(500, "MOMO_CONFIG_MISSING", "MoMo credentials are not configured");
  }

  const partnerCode = String(body.partnerCode ?? "");
  const orderId = String(body.orderId ?? "");
  const requestId = String(body.requestId ?? "");
  const amount = String(body.amount ?? "");
  const orderInfo = String(body.orderInfo ?? "");
  const transId = String(body.transId ?? "");
  const resultCode = String(body.resultCode ?? "");
  const message = String(body.message ?? "");
  const responseTime = String(body.responseTime ?? "");
  const extraData = String(body.extraData ?? "");
  const signature = String(body.signature ?? "");

  const rawSignature = `accessKey=${momoAccessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const calculatedSignature = crypto
    .createHmac("sha256", momoSecretKey)
    .update(rawSignature)
    .digest("hex");

  return calculatedSignature === signature;
};

const stockRequests = (items: OrderItem[]): StockRequest[] => {
  const requestsByProductId = new Map<string, StockRequest>();

  for (const item of items) {
    const productId = item.productId.toString();
    const existing = requestsByProductId.get(productId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      requestsByProductId.set(productId, { productId: item.productId, quantity: item.quantity });
    }
  }

  return [...requestsByProductId.values()].sort((first, second) =>
    first.productId.toString().localeCompare(second.productId.toString())
  );
};

const stockReviewMessage = async (items: OrderItem[], dbSession: mongoose.ClientSession): Promise<string | null> => {
  const requests = stockRequests(items);
  const products = await ProductModel.find({ _id: { $in: requests.map((item) => item.productId) } })
    .select("_id stockQuantity status")
    .session(dbSession)
    .lean<Array<{ _id: Types.ObjectId; stockQuantity: number; status: string }>>()
    .exec();
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));

  for (const item of requests) {
    const product = productsById.get(item.productId.toString());
    if (!product || product.status !== "ACTIVE" || product.stockQuantity < item.quantity) {
      return "Payment succeeded but stock could not be fulfilled";
    }
  }

  return null;
};

const decrementStock = async (items: OrderItem[], dbSession: mongoose.ClientSession): Promise<void> => {
  for (const item of stockRequests(items)) {
    const result = await ProductModel.updateOne(
      {
        _id: item.productId,
        status: "ACTIVE",
        stockQuantity: { $gte: item.quantity }
      },
      { $inc: { stockQuantity: -item.quantity } },
      { runValidators: true, session: dbSession }
    ).exec();

    if (result.modifiedCount !== 1) {
      throw new AppError(409, "PAYMENT_STOCK_UNAVAILABLE", "Payment succeeded but stock could not be fulfilled");
    }
  }
};

const markPaymentReview = async (
  orderId: Types.ObjectId,
  paymentId: Types.ObjectId,
  message: string,
  paidAt: Date,
  providerPaymentId: string | undefined,
  dbSession: mongoose.ClientSession
): Promise<void> => {
  await PaymentModel.updateOne(
    { _id: paymentId },
    {
      $set: {
        status: "PAID",
        providerPaymentId,
        paidAt,
        failureCode: "PAYMENT_REVIEW_REQUIRED",
        failureMessage: message
      }
    },
    { runValidators: true, session: dbSession }
  ).exec();

  await OrderModel.updateOne(
    { _id: orderId },
    { $set: { paymentStatus: "PAID", paidAt } },
    { runValidators: true, session: dbSession }
  ).exec();
};

const markSuccess = async (body: MomoWebhookPayload, dbSession: mongoose.ClientSession): Promise<WebhookOutcome> => {
  const config = getConfig();
  const orderId = new Types.ObjectId(String(body.orderId));
  
  const payment = await PaymentModel.findOne({ orderId }).session(dbSession).exec();
  const order = await OrderModel.findById(orderId).session(dbSession).exec();

  if (!payment || !order) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment or order not found");
  }

  const paidAt = payment.paidAt ?? order.paidAt ?? new Date();

  // Validate amount
  if (Number(body.amount) !== payment.amountMinor) {
    await markPaymentReview(
      order._id,
      payment._id,
      "MoMo payment amount does not match local payment",
      paidAt,
      String(body.transId),
      dbSession
    );
    logger.warn(config, "MoMo Payment moved to review due to amount mismatch", {
      orderId: order._id.toString(),
      paymentId: payment._id.toString(),
      providerEventId: body.requestId
    });
    return "PROCESSED";
  }

  if (payment.status === "PAID" && order.paymentStatus === "PAID") {
    logger.info(config, "MoMo success webhook already finalized", {
      orderId: order._id.toString(),
      paymentId: payment._id.toString(),
      providerEventId: body.requestId
    });
    return "PROCESSED";
  }

  // Validate stock
  const reviewMessage = await stockReviewMessage(order.items, dbSession);
  if (reviewMessage) {
    await markPaymentReview(
      order._id,
      payment._id,
      reviewMessage,
      paidAt,
      String(body.transId),
      dbSession
    );
    logger.warn(config, "MoMo Payment moved to review due to stock constraints", {
      orderId: order._id.toString(),
      paymentId: payment._id.toString(),
      providerEventId: body.requestId
    });
    return "PROCESSED";
  }

  await decrementStock(order.items, dbSession);

  await PaymentModel.updateOne(
    { _id: payment._id, status: { $ne: "PAID" } },
    {
      $set: {
        status: "PAID",
        providerPaymentId: String(body.transId),
        paidAt
      },
      $unset: {
        failureCode: "",
        failureMessage: ""
      }
    },
    { runValidators: true, session: dbSession }
  ).exec();

  await OrderModel.updateOne(
    { _id: order._id, paymentStatus: { $ne: "PAID" } },
    {
      $set: {
        paymentStatus: "PAID",
        paidAt
      }
    },
    { runValidators: true, session: dbSession }
  ).exec();

  logger.info(config, "MoMo success webhook finalized payment", {
    orderId: order._id.toString(),
    paymentId: payment._id.toString(),
    providerEventId: body.requestId
  });

  return "PROCESSED";
};

const markFailure = async (body: MomoWebhookPayload, dbSession: mongoose.ClientSession): Promise<WebhookOutcome> => {
  const config = getConfig();
  const orderId = new Types.ObjectId(String(body.orderId));
  const payment = await PaymentModel.findOne({ orderId }).session(dbSession).exec();

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (payment.status === "PAID") {
    logger.info(config, "MoMo failure webhook ignored for succeeded payment", {
      orderId: orderId.toString(),
      paymentId: payment._id.toString(),
      providerEventId: body.requestId
    });
    return "PROCESSED";
  }

  await PaymentModel.updateOne(
    { _id: payment._id, status: { $ne: "PAID" } },
    {
      $set: {
        status: "FAILED",
        providerPaymentId: String(body.transId || ""),
        failureCode: "PAYMENT_FAILED",
        failureMessage: body.message || "MoMo payment failed"
      }
    },
    { runValidators: true, session: dbSession }
  ).exec();

  await OrderModel.updateOne(
    { _id: orderId, paymentStatus: { $ne: "PAID" } },
    { $set: { paymentStatus: "FAILED" } },
    { runValidators: true, session: dbSession }
  ).exec();

  logger.warn(config, "MoMo failure webhook marked payment failed", {
    orderId: orderId.toString(),
    paymentId: payment._id.toString(),
    providerEventId: body.requestId,
    errorCode: "PAYMENT_FAILED"
  });

  return "PROCESSED";
};

export const handleMomoWebhook = async (body: MomoWebhookPayload, logContext: LogFields = {}): Promise<void> => {
  const config = getConfig();

  // 1. Verify signature
  const isSignatureValid = verifyMomoSignature(body, config);
  if (!isSignatureValid) {
    throw new AppError(400, "MOMO_SIGNATURE_INVALID", "MoMo signature is invalid");
  }

  const providerEventId = String(body.requestId || "");
  const orderIdStr = String(body.orderId || "");

  if (!providerEventId || !orderIdStr || !Types.ObjectId.isValid(orderIdStr)) {
    throw new AppError(400, "MOMO_WEBHOOK_PAYLOAD_INVALID", "MoMo webhook payload is invalid");
  }

  logger.info(config, "MoMo webhook received", { ...logContext, providerEventId, resultCode: body.resultCode });

  // 2. Track / Deduplicate webhook
  try {
    await PaymentWebhookEventModel.create({
      provider: "MOMO",
      providerEventId,
      eventType: `momo.result.${body.resultCode}`,
      payload: body,
      processingStatus: "RECEIVED"
    });
  } catch (error) {
    const isDuplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === 11000;

    if (!isDuplicate) {
      throw error;
    }

    const existingEvent = await PaymentWebhookEventModel.findOne({ providerEventId })
      .select("processingStatus")
      .lean()
      .exec();

    if (existingEvent?.processingStatus === "PROCESSED" || existingEvent?.processingStatus === "IGNORED") {
      logger.info(config, "Duplicate MoMo webhook ignored", { ...logContext, providerEventId });
      return;
    }

    await PaymentWebhookEventModel.updateOne(
      { providerEventId },
      { $inc: { retryCount: 1 }, $set: { processingStatus: "RECEIVED", errorMessage: undefined } },
      { runValidators: true }
    ).exec();
  }

  // 3. Process inside Transaction
  const dbSession = await mongoose.startSession();

  try {
    await dbSession.withTransaction(async () => {
      await PaymentWebhookEventModel.updateOne(
        { providerEventId },
        { $set: { processingStatus: "PROCESSING" } },
        { runValidators: true, session: dbSession }
      ).exec();

      const outcome = body.resultCode === 0 ? await markSuccess(body, dbSession) : await markFailure(body, dbSession);

      await PaymentWebhookEventModel.updateOne(
        { providerEventId },
        {
          $set: {
            processingStatus: outcome,
            processedAt: new Date(),
            errorMessage: undefined
          }
        },
        { runValidators: true, session: dbSession }
      ).exec();

      logger.info(config, "MoMo webhook processed successfully", { ...logContext, providerEventId, outcome });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MoMo webhook processing failed";
    await PaymentWebhookEventModel.updateOne(
      { providerEventId },
      { $set: { processingStatus: "FAILED", errorMessage: message } },
      { runValidators: true }
    ).exec();

    logger.error(config, "MoMo webhook processing failed", { ...logContext, providerEventId, error: message });
    throw error;
  } finally {
    await dbSession.endSession();
  }
};
