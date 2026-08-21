import { Types } from "mongoose";
import type Stripe from "stripe";
import { AppError } from "../../common/errors/AppError.js";
import { logger, type LogFields } from "../../common/logger.js";
import { getConfig, type AppConfig } from "../../config/env.js";
import { OrderModel, type Order } from "../orders/order.model.js";
import { PaymentModel, type Payment } from "./payment.model.js";
import { createStripeCheckoutSession } from "./stripe.client.js";

type OrderRecord = Order & { _id: Types.ObjectId };
type PaymentRecord = Payment & { _id: Types.ObjectId };

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface PaymentStatusResponse {
  payment: {
    orderId: string;
    status: Payment["status"];
    amountMinor: number;
    currency: string;
    provider: Payment["provider"];
    providerCheckoutSessionId: string | null;
    providerPaymentId: string | null;
    paidAt: string | null;
    failureCode: string | null;
    failureMessage: string | null;
  };
  order: {
    id: string;
    orderStatus: Order["orderStatus"];
    paymentStatus: Order["paymentStatus"];
    paidAt: string | null;
  };
}

const orderSelect = "_id userId items totalMinor currency paymentMethod orderStatus paymentStatus paidAt";
const paymentSelect =
  "_id orderId userId provider providerPaymentId providerCheckoutSessionId amountMinor currency status failureCode failureMessage paidAt";
const payableOrderStatuses = new Set<Order["orderStatus"]>(["PENDING", "PROCESSING"]);
const payablePaymentStatuses = new Set<Payment["status"]>(["PENDING", "FAILED"]);

const requireStripeUrl = (template: string | undefined, orderId: string): string => {
  if (!template) {
    throw new AppError(500, "STRIPE_CONFIG_MISSING", "Stripe is not configured");
  }

  return template.replace("{ORDER_ID}", encodeURIComponent(orderId));
};

const toDateString = (value: Date | undefined): string | null => value?.toISOString() ?? null;

const findOwnedOrder = async (userId: string, orderId: string): Promise<OrderRecord> => {
  const order = await OrderModel.findOne({ _id: new Types.ObjectId(orderId), userId: new Types.ObjectId(userId) })
    .select(orderSelect)
    .lean<OrderRecord>()
    .exec();

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return order;
};

const findPaymentForOrder = async (userId: string, orderId: string): Promise<PaymentRecord> => {
  const payment = await PaymentModel.findOne({ orderId: new Types.ObjectId(orderId), userId: new Types.ObjectId(userId) })
    .select(paymentSelect)
    .lean<PaymentRecord>()
    .exec();

  if (!payment) {
    throw new AppError(404, "PAYMENT_NOT_FOUND", "Payment not found");
  }

  return payment;
};

const assertPaymentMatchesOrder = (payment: PaymentRecord, order: OrderRecord): void => {
  if (payment.amountMinor !== order.totalMinor || payment.currency !== order.currency) {
    throw new AppError(409, "PAYMENT_AMOUNT_MISMATCH", "Payment amount does not match order total");
  }
};

const buildLineItems = (order: OrderRecord): Stripe.Checkout.SessionCreateParams.LineItem[] =>
  order.items.map((item) => ({
    price_data: {
      currency: order.currency.toLowerCase(),
      product_data: {
        name: item.productName,
        metadata: {
          productId: item.productId.toString()
        }
      },
      unit_amount: item.unitPriceMinor
    },
    quantity: item.quantity
  }));

const buildMetadata = (order: OrderRecord, payment: PaymentRecord): Record<string, string> => ({
  orderId: order._id.toString(),
  paymentId: payment._id.toString(),
  userId: order.userId.toString()
});

export const createCheckoutSession = async (
  userId: string,
  orderId: string,
  config: AppConfig = getConfig(),
  logContext: LogFields = {}
): Promise<CheckoutSessionResponse> => {
  const order = await findOwnedOrder(userId, orderId);
  const payment = await findPaymentForOrder(userId, orderId);

  if (payment.provider === "COD") {
    throw new AppError(409, "ORDER_NOT_PAYABLE", "COD orders cannot be paid online");
  }

  if (!payableOrderStatuses.has(order.orderStatus) || !payablePaymentStatuses.has(order.paymentStatus)) {
    throw new AppError(409, "ORDER_NOT_PAYABLE", "Order is not payable");
  }

  if (!payablePaymentStatuses.has(payment.status)) {
    throw new AppError(409, "PAYMENT_NOT_PAYABLE", "Payment is not payable");
  }

  assertPaymentMatchesOrder(payment, order);

  const metadata = buildMetadata(order, payment);
  const stripeSession = await createStripeCheckoutSession(
    {
      mode: "payment",
      line_items: buildLineItems(order),
      success_url: requireStripeUrl(config.stripeSuccessUrl, orderId),
      cancel_url: requireStripeUrl(config.stripeCancelUrl, orderId),
      metadata,
      payment_intent_data: {
        metadata
      }
    },
    `checkout-session:${payment._id.toString()}`,
    config
  );

  if (!stripeSession.url) {
    throw new AppError(502, "STRIPE_CHECKOUT_URL_MISSING", "Stripe checkout URL is missing");
  }

  await PaymentModel.updateOne(
    {
      _id: payment._id,
      status: { $in: [...payablePaymentStatuses] }
    },
    {
      $set: {
        providerCheckoutSessionId: stripeSession.id
      },
      $unset: {
        failureCode: "",
        failureMessage: ""
      }
    },
    { runValidators: true }
  ).exec();

  logger.info(config, "Stripe checkout session created", {
    ...logContext,
    userId,
    orderId: order._id.toString(),
    paymentId: payment._id.toString(),
    providerCheckoutSessionId: stripeSession.id
  });

  return {
    checkoutUrl: stripeSession.url,
    sessionId: stripeSession.id
  };
};

export const getPaymentStatusByOrder = async (userId: string, orderId: string): Promise<PaymentStatusResponse> => {
  const order = await findOwnedOrder(userId, orderId);
  const payment = await findPaymentForOrder(userId, orderId);

  return {
    payment: {
      orderId: payment.orderId.toString(),
      status: payment.status,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      provider: payment.provider,
      providerCheckoutSessionId: payment.providerCheckoutSessionId ?? null,
      providerPaymentId: payment.providerPaymentId ?? null,
      paidAt: toDateString(payment.paidAt),
      failureCode: payment.failureCode ?? null,
      failureMessage: payment.failureMessage ?? null
    },
    order: {
      id: order._id.toString(),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paidAt: toDateString(order.paidAt)
    }
  };
};
