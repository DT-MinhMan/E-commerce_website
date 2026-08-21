import mongoose, { Types } from "mongoose";
import type Stripe from "stripe";
import { AppError } from "../../common/errors/AppError.js";
import { logger, type LogFields } from "../../common/logger.js";
import { getConfig } from "../../config/env.js";
import { ProductModel } from "../catalog/product.model.js";
import { OrderModel, type Order } from "../orders/order.model.js";
import { PaymentModel, type Payment } from "./payment.model.js";
import { PaymentWebhookEventModel } from "./paymentWebhookEvent.model.js";
import { constructStripeWebhookEvent } from "./stripe.client.js";

type WebhookOutcome = "PROCESSED" | "IGNORED" | "FAILED";
type LocalPayment = Payment & { _id: Types.ObjectId };
type LocalOrder = Order & { _id: Types.ObjectId };
type OrderItem = LocalOrder["items"][number];
interface StockRequest {
  productId: Types.ObjectId;
  quantity: number;
}
interface FailureDetails {
  orderId: string | undefined;
  paymentId: string | undefined;
  providerPaymentId: string | undefined;
  failureCode?: string;
  failureMessage?: string;
}

const supportedEvents = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "payment_intent.payment_failed"
]);

const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === 11000;

const metadataValue = (metadata: Stripe.Metadata | null | undefined, key: string): string | undefined => {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
};

const paymentIntentId = (value: string | Stripe.PaymentIntent | null): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  return value?.id;
};

const checkoutSessionDetails = (session: Stripe.Checkout.Session) => ({
  orderId: metadataValue(session.metadata, "orderId"),
  paymentId: metadataValue(session.metadata, "paymentId"),
  amountMinor: session.amount_total ?? undefined,
  currency: session.currency?.toUpperCase(),
  providerCheckoutSessionId: session.id,
  providerPaymentId: paymentIntentId(session.payment_intent)
});

const paymentIntentDetails = (intent: Stripe.PaymentIntent): FailureDetails => ({
  orderId: metadataValue(intent.metadata, "orderId"),
  paymentId: metadataValue(intent.metadata, "paymentId"),
  providerPaymentId: intent.id,
  failureCode: intent.last_payment_error?.code,
  failureMessage: intent.last_payment_error?.message
});

const parseTrustedIds = (orderId: string | undefined, paymentId: string | undefined): { orderId: Types.ObjectId; paymentId: Types.ObjectId } => {
  if (!orderId || !paymentId || !Types.ObjectId.isValid(orderId) || !Types.ObjectId.isValid(paymentId)) {
    throw new AppError(400, "STRIPE_WEBHOOK_METADATA_INVALID", "Stripe webhook metadata is invalid");
  }

  return {
    orderId: new Types.ObjectId(orderId),
    paymentId: new Types.ObjectId(paymentId)
  };
};

const markPaymentReview = async (
  orderId: Types.ObjectId,
  paymentId: Types.ObjectId,
  message: string,
  paidAt: Date | undefined,
  providerCheckoutSessionId: string | undefined,
  providerPaymentId: string | undefined,
  dbSession: mongoose.ClientSession
): Promise<void> => {
  await PaymentModel.updateOne(
    { _id: paymentId },
    {
      $set: {
        status: "PAID",
        providerCheckoutSessionId,
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

  return [...requestsByProductId.values()].sort((first, second) => first.productId.toString().localeCompare(second.productId.toString()));
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

const trustedAmountError = (
  payment: LocalPayment,
  order: LocalOrder,
  amountMinor: number | undefined,
  currency: string | undefined,
  providerCheckoutSessionId: string,
  providerPaymentId: string | undefined
): string | null => {
  if (amountMinor === undefined || currency === undefined) {
    return "Stripe event is missing amount or currency";
  }

  if (payment.amountMinor !== order.totalMinor || payment.currency !== order.currency) {
    return "Local payment amount does not match order total";
  }

  if (amountMinor !== payment.amountMinor || currency !== payment.currency) {
    return "Stripe event amount does not match local payment";
  }

  if (payment.providerCheckoutSessionId && payment.providerCheckoutSessionId !== providerCheckoutSessionId) {
    return "Stripe checkout session does not match local payment";
  }

  if (payment.providerPaymentId && providerPaymentId && payment.providerPaymentId !== providerPaymentId) {
    return "Stripe payment intent does not match local payment";
  }

  return null;
};

const markSuccess = async (event: Stripe.Event, dbSession: mongoose.ClientSession): Promise<WebhookOutcome> => {
  const config = getConfig();
  const details = checkoutSessionDetails(event.data.object as Stripe.Checkout.Session);
  const ids = parseTrustedIds(details.orderId, details.paymentId);
  const payment = await PaymentModel.findOne({ _id: ids.paymentId, orderId: ids.orderId }).session(dbSession).exec();
  const order = await OrderModel.findById(ids.orderId).session(dbSession).exec();

  if (!payment || !order) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  const paidAt = payment.paidAt ?? order.paidAt ?? new Date();

  const verificationError = trustedAmountError(
    payment,
    order,
    details.amountMinor,
    details.currency,
    details.providerCheckoutSessionId,
    details.providerPaymentId
  );
  if (verificationError) {
    await markPaymentReview(
      ids.orderId,
      ids.paymentId,
      verificationError,
      paidAt,
      details.providerCheckoutSessionId,
      details.providerPaymentId,
      dbSession
    );
    logger.warn(config, "Payment moved to review", {
      orderId: ids.orderId.toString(),
      paymentId: ids.paymentId.toString(),
      providerEventId: event.id,
      errorCode: "PAYMENT_REVIEW_REQUIRED"
    });
    return "PROCESSED";
  }

  if (payment.status === "PAID" && order.paymentStatus === "PAID") {
    logger.info(config, "Stripe success webhook already finalized", {
      orderId: ids.orderId.toString(),
      paymentId: ids.paymentId.toString(),
      providerEventId: event.id
    });
    return "PROCESSED";
  }

  const reviewMessage = await stockReviewMessage(order.items, dbSession);
  if (reviewMessage) {
    await markPaymentReview(
      ids.orderId,
      ids.paymentId,
      reviewMessage,
      paidAt,
      details.providerCheckoutSessionId,
      details.providerPaymentId,
      dbSession
    );
    logger.warn(config, "Payment moved to review", {
      orderId: ids.orderId.toString(),
      paymentId: ids.paymentId.toString(),
      providerEventId: event.id,
      errorCode: "PAYMENT_REVIEW_REQUIRED"
    });
    return "PROCESSED";
  }

  await decrementStock(order.items, dbSession);

  await PaymentModel.updateOne(
    { _id: ids.paymentId, status: { $ne: "PAID" } },
    {
      $set: {
        status: "PAID",
        providerCheckoutSessionId: details.providerCheckoutSessionId,
        providerPaymentId: details.providerPaymentId,
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
    { _id: ids.orderId, paymentStatus: { $ne: "PAID" } },
    {
      $set: {
        paymentStatus: "PAID",
        paidAt
      }
    },
    { runValidators: true, session: dbSession }
  ).exec();

  logger.info(config, "Stripe success webhook finalized payment", {
    orderId: ids.orderId.toString(),
    paymentId: ids.paymentId.toString(),
    providerEventId: event.id
  });

  return "PROCESSED";
};

const markFailure = async (event: Stripe.Event, dbSession: mongoose.ClientSession): Promise<WebhookOutcome> => {
  const config = getConfig();
  const details: FailureDetails =
    event.type === "payment_intent.payment_failed"
      ? paymentIntentDetails(event.data.object as Stripe.PaymentIntent)
      : {
          ...checkoutSessionDetails(event.data.object as Stripe.Checkout.Session),
          failureCode: "PAYMENT_FAILED",
          failureMessage: "Stripe payment failed"
        };
  const ids = parseTrustedIds(details.orderId, details.paymentId);
  const payment = await PaymentModel.findOne({ _id: ids.paymentId, orderId: ids.orderId }).session(dbSession).exec();

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  if (payment.status === "PAID") {
    logger.info(config, "Stripe failure webhook ignored for succeeded payment", {
      orderId: ids.orderId.toString(),
      paymentId: ids.paymentId.toString(),
      providerEventId: event.id
    });
    return "PROCESSED";
  }

  await PaymentModel.updateOne(
    { _id: ids.paymentId, status: { $ne: "PAID" } },
    {
      $set: {
        status: "FAILED",
        providerPaymentId: details.providerPaymentId,
        failureCode: details.failureCode ?? "PAYMENT_FAILED",
        failureMessage: details.failureMessage ?? "Stripe payment failed"
      }
    },
    { runValidators: true, session: dbSession }
  ).exec();

  await OrderModel.updateOne(
    { _id: ids.orderId, paymentStatus: { $ne: "PAID" } },
    { $set: { paymentStatus: "FAILED" } },
    { runValidators: true, session: dbSession }
  ).exec();

  logger.warn(config, "Stripe failure webhook marked payment failed", {
    orderId: ids.orderId.toString(),
    paymentId: ids.paymentId.toString(),
    providerEventId: event.id,
    errorCode: details.failureCode ?? "PAYMENT_FAILED"
  });

  return "PROCESSED";
};

const processEvent = async (event: Stripe.Event, dbSession: mongoose.ClientSession): Promise<WebhookOutcome> => {
  if (!supportedEvents.has(event.type)) {
    return "IGNORED";
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.payment_status === "paid" ? markSuccess(event, dbSession) : "IGNORED";
  }

  return markFailure(event, dbSession);
};

export const handleStripeWebhook = async (rawBody: Buffer, signature: string | undefined, logContext: LogFields = {}): Promise<void> => {
  const config = getConfig();

  if (!signature) {
    throw new AppError(400, "STRIPE_SIGNATURE_MISSING", "Stripe signature is missing");
  }

  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(rawBody, signature);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(400, "STRIPE_SIGNATURE_INVALID", "Stripe signature is invalid");
  }

  logger.info(config, "Stripe webhook received", { ...logContext, providerEventId: event.id, eventType: event.type });

  try {
    await PaymentWebhookEventModel.create({
      provider: "STRIPE",
      providerEventId: event.id,
      eventType: event.type,
      payload: event,
      processingStatus: "RECEIVED"
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const existingEvent = await PaymentWebhookEventModel.findOne({ providerEventId: event.id }).select("processingStatus").lean().exec();
    if (existingEvent?.processingStatus === "PROCESSED" || existingEvent?.processingStatus === "IGNORED") {
      logger.info(config, "Duplicate Stripe webhook ignored", { ...logContext, providerEventId: event.id, eventType: event.type });
      return;
    }

    await PaymentWebhookEventModel.updateOne(
      { providerEventId: event.id },
      { $inc: { retryCount: 1 }, $set: { processingStatus: "RECEIVED", errorMessage: undefined } },
      { runValidators: true }
    ).exec();
  }

  const dbSession = await mongoose.startSession();

  try {
    await dbSession.withTransaction(async () => {
      await PaymentWebhookEventModel.updateOne(
        { providerEventId: event.id },
        { $set: { processingStatus: "PROCESSING" } },
        { runValidators: true, session: dbSession }
      ).exec();

      const outcome = await processEvent(event, dbSession);
      await PaymentWebhookEventModel.updateOne(
        { providerEventId: event.id },
        {
          $set: {
            processingStatus: outcome,
            processedAt: new Date(),
            errorMessage: undefined
          }
        },
        { runValidators: true, session: dbSession }
      ).exec();
      logger.info(config, "Stripe webhook processed", { ...logContext, providerEventId: event.id, eventType: event.type, outcome });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook processing failed";
    await PaymentWebhookEventModel.updateOne(
      { providerEventId: event.id },
      { $set: { processingStatus: "FAILED", errorMessage: message } },
      { runValidators: true }
    ).exec();

    logger.error(config, "Stripe webhook failed", { ...logContext, providerEventId: event.id, eventType: event.type, error: message });
    throw error;
  } finally {
    await dbSession.endSession();
  }
};
