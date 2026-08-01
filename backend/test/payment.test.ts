import { Types } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { getConfig } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { OrderModel } from "../src/modules/orders/order.model.js";
import { PaymentModel } from "../src/modules/payments/payment.model.js";
import { PaymentWebhookEventModel } from "../src/modules/payments/paymentWebhookEvent.model.js";
import { createStripeCheckoutSession, constructStripeWebhookEvent } from "../src/modules/payments/stripe.client.js";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "./helpers/database.js";

vi.mock("../src/modules/payments/stripe.client.js", () => ({
  createStripeCheckoutSession: vi.fn(),
  constructStripeWebhookEvent: vi.fn()
}));

const mockedCreateStripeCheckoutSession = vi.mocked(createStripeCheckoutSession);
const mockedConstructStripeWebhookEvent = vi.mocked(constructStripeWebhookEvent);

const objectId = () => new Types.ObjectId();
const customerToken = (userId = objectId()): string => signAccessToken(getConfig(), { sub: userId.toString(), role: "CUSTOMER" });
const adminToken = (): string => signAccessToken(getConfig(), { sub: objectId().toString(), role: "ADMIN" });

const shippingAddress = {
  recipientName: "Demo Customer",
  phone: "1234567890",
  addressLine1: "123 Test Street",
  city: "Test City",
  stateOrProvince: "Test State",
  postalCode: "12345",
  countryCode: "US"
};

const orderInput = (userId: Types.ObjectId, overrides: Partial<{ totalMinor: number; currency: string; orderStatus: string; paymentStatus: string }> = {}) => ({
  orderNumber: `ORD-20260731-${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0")}`,
  userId,
  items: [
    {
      productId: objectId(),
      productName: "Original Keyboard",
      productSlug: "original-keyboard",
      productImage: "https://example.com/keyboard.png",
      unitPriceMinor: overrides.totalMinor ?? 5000,
      quantity: 1,
      lineTotalMinor: overrides.totalMinor ?? 5000
    }
  ],
  shippingAddress,
  subtotalMinor: overrides.totalMinor ?? 5000,
  shippingFeeMinor: 0,
  totalMinor: overrides.totalMinor ?? 5000,
  currency: overrides.currency ?? "USD",
  orderStatus: overrides.orderStatus ?? "PENDING_PAYMENT",
  paymentStatus: overrides.paymentStatus ?? "PENDING"
});

const seedOrderAndPayment = async (
  userId = objectId(),
  overrides: Partial<{ totalMinor: number; currency: string; orderStatus: string; paymentStatus: string; paymentAmountMinor: number; paymentStatusOnly: string }> = {}
) => {
  const order = await OrderModel.create(orderInput(userId, overrides));
  const payment = await PaymentModel.create({
    orderId: order._id,
    userId,
    provider: "STRIPE",
    amountMinor: overrides.paymentAmountMinor ?? overrides.totalMinor ?? 5000,
    currency: overrides.currency ?? "USD",
    status: overrides.paymentStatusOnly ?? "PENDING"
  });

  return { userId, order, payment };
};

const stripeCheckoutSession = (
  id: string,
  orderId: string,
  paymentId: string,
  overrides: Partial<{ amountTotal: number; currency: string; paymentStatus: string; paymentIntent: string }> = {}
) =>
  ({
    id,
    object: "checkout.session",
    amount_total: overrides.amountTotal ?? 5000,
    currency: overrides.currency ?? "usd",
    metadata: { orderId, paymentId, userId: objectId().toString() },
    payment_intent: overrides.paymentIntent ?? "pi_test",
    payment_status: overrides.paymentStatus ?? "paid"
  }) as never;

const stripeEvent = (id: string, type: string, dataObject: unknown) =>
  ({
    id,
    type,
    data: { object: dataObject }
  }) as never;

describe("payments API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await clearTestDatabase();
    mockedCreateStripeCheckoutSession.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay"
    } as never);
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("protects payment routes for customers only", async () => {
    await request(app).post("/api/v1/payments/checkout-session").send({ orderId: objectId().toString() }).expect(401);

    const forbidden = await request(app)
      .post("/api/v1/payments/checkout-session")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ orderId: objectId().toString() })
      .expect(403);
    expect(forbidden.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("creates a Stripe checkout session from the immutable order snapshot", async () => {
    const { userId, order, payment } = await seedOrderAndPayment();

    const response = await request(app)
      .post("/api/v1/payments/checkout-session")
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .send({ orderId: order._id.toString() })
      .expect(200);

    expect(response.body.data).toEqual({
      checkoutUrl: "https://checkout.stripe.com/c/pay",
      sessionId: "cs_test_123"
    });
    expect(mockedCreateStripeCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        success_url: `http://localhost:5173/payment/success?orderId=${order._id.toString()}`,
        cancel_url: `http://localhost:5173/payment/cancel?orderId=${order._id.toString()}`,
        metadata: {
          orderId: order._id.toString(),
          paymentId: payment._id.toString(),
          userId: userId.toString()
        },
        payment_intent_data: {
          metadata: {
            orderId: order._id.toString(),
            paymentId: payment._id.toString(),
            userId: userId.toString()
          }
        }
      }),
      `checkout-session:${payment._id.toString()}`,
      expect.any(Object)
    );
    expect(mockedCreateStripeCheckoutSession.mock.calls[0]?.[0].line_items).toEqual([
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Original Keyboard",
            metadata: { productId: order.items[0]?.productId.toString() }
          },
          unit_amount: 5000
        },
        quantity: 1
      }
    ]);
    expect((await PaymentModel.findById(payment._id).lean().exec())?.providerCheckoutSessionId).toBe("cs_test_123");
  });

  it("rejects another user's order, non-payable states, and amount mismatches", async () => {
    const { order } = await seedOrderAndPayment();
    await request(app)
      .post("/api/v1/payments/checkout-session")
      .set("Authorization", `Bearer ${customerToken(objectId())}`)
      .send({ orderId: order._id.toString() })
      .expect(404);

    const paidOrder = await seedOrderAndPayment(objectId(), { orderStatus: "PAID", paymentStatus: "SUCCEEDED", paymentStatusOnly: "SUCCEEDED" });
    const paidResponse = await request(app)
      .post("/api/v1/payments/checkout-session")
      .set("Authorization", `Bearer ${customerToken(paidOrder.userId)}`)
      .send({ orderId: paidOrder.order._id.toString() })
      .expect(409);
    expect(paidResponse.body.error.code).toBe("ORDER_NOT_PAYABLE");

    const mismatch = await seedOrderAndPayment(objectId(), { totalMinor: 7000, paymentAmountMinor: 6000 });
    const mismatchResponse = await request(app)
      .post("/api/v1/payments/checkout-session")
      .set("Authorization", `Bearer ${customerToken(mismatch.userId)}`)
      .send({ orderId: mismatch.order._id.toString() })
      .expect(409);
    expect(mismatchResponse.body.error.code).toBe("PAYMENT_AMOUNT_MISMATCH");
  });

  it("returns payment status by owned order", async () => {
    const { userId, order, payment } = await seedOrderAndPayment();
    await PaymentModel.updateOne({ _id: payment._id }, { $set: { providerCheckoutSessionId: "cs_test_123" } }).exec();

    const response = await request(app)
      .get(`/api/v1/payments/orders/${order._id.toString()}`)
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .expect(200);

    expect(response.body.data).toMatchObject({
      payment: {
        orderId: order._id.toString(),
        status: "PENDING",
        amountMinor: 5000,
        currency: "USD",
        provider: "STRIPE",
        providerCheckoutSessionId: "cs_test_123",
        providerPaymentId: null,
        paidAt: null
      },
      order: {
        id: order._id.toString(),
        orderStatus: "PENDING_PAYMENT",
        paymentStatus: "PENDING",
        paidAt: null
      }
    });
  });

  it("requires a valid Stripe signature before persisting webhook events", async () => {
    await request(app).post("/api/v1/webhooks/stripe").set("Content-Type", "application/json").send({}).expect(400);
    expect(await PaymentWebhookEventModel.countDocuments()).toBe(0);

    mockedConstructStripeWebhookEvent.mockImplementationOnce(() => {
      throw new Error("invalid signature");
    });
    const invalid = await request(app)
      .post("/api/v1/webhooks/stripe")
      .set("Stripe-Signature", "bad")
      .set("Content-Type", "application/json")
      .send({ id: "evt_bad" })
      .expect(400);
    expect(invalid.body.error.code).toBe("STRIPE_SIGNATURE_INVALID");
    expect(await PaymentWebhookEventModel.countDocuments()).toBe(0);
  });

  it("processes success webhooks idempotently", async () => {
    const { order, payment } = await seedOrderAndPayment();
    const event = stripeEvent(
      "evt_success",
      "checkout.session.completed",
      stripeCheckoutSession("cs_test_123", order._id.toString(), payment._id.toString(), { paymentIntent: "pi_success" })
    );
    mockedConstructStripeWebhookEvent.mockReturnValue(event);

    await request(app).post("/api/v1/webhooks/stripe").set("Stripe-Signature", "valid").set("Content-Type", "application/json").send({}).expect(200);
    const firstPayment = await PaymentModel.findById(payment._id).lean().exec();
    const firstOrder = await OrderModel.findById(order._id).lean().exec();

    expect(firstPayment).toMatchObject({ status: "SUCCEEDED", providerCheckoutSessionId: "cs_test_123", providerPaymentId: "pi_success" });
    expect(firstPayment?.paidAt).toBeInstanceOf(Date);
    expect(firstOrder).toMatchObject({ orderStatus: "PAID", paymentStatus: "SUCCEEDED" });
    expect(firstOrder?.paidAt).toBeInstanceOf(Date);
    expect((await PaymentWebhookEventModel.findOne({ providerEventId: "evt_success" }).lean().exec())?.processingStatus).toBe("PROCESSED");

    await request(app).post("/api/v1/webhooks/stripe").set("Stripe-Signature", "valid").set("Content-Type", "application/json").send({}).expect(200);
    const duplicatePayment = await PaymentModel.findById(payment._id).lean().exec();
    expect(duplicatePayment?.paidAt?.toISOString()).toBe(firstPayment?.paidAt?.toISOString());
    expect(await PaymentWebhookEventModel.countDocuments({ providerEventId: "evt_success" })).toBe(1);
  });

  it("does not downgrade success when a stale failure arrives later", async () => {
    const { order, payment } = await seedOrderAndPayment(objectId(), { orderStatus: "PAID", paymentStatus: "SUCCEEDED", paymentStatusOnly: "SUCCEEDED" });
    await OrderModel.updateOne({ _id: order._id }, { $set: { paidAt: new Date() } }).exec();
    await PaymentModel.updateOne({ _id: payment._id }, { $set: { paidAt: new Date(), providerPaymentId: "pi_success" } }).exec();
    mockedConstructStripeWebhookEvent.mockReturnValue(
      stripeEvent("evt_failed_late", "payment_intent.payment_failed", {
        id: "pi_success",
        metadata: { orderId: order._id.toString(), paymentId: payment._id.toString() },
        last_payment_error: { code: "card_declined", message: "Declined" }
      })
    );

    await request(app).post("/api/v1/webhooks/stripe").set("Stripe-Signature", "valid").set("Content-Type", "application/json").send({}).expect(200);

    expect((await PaymentModel.findById(payment._id).lean().exec())?.status).toBe("SUCCEEDED");
    expect((await OrderModel.findById(order._id).lean().exec())?.paymentStatus).toBe("SUCCEEDED");
  });

  it("moves amount mismatch success events to review without marking paid", async () => {
    const { order, payment } = await seedOrderAndPayment();
    mockedConstructStripeWebhookEvent.mockReturnValue(
      stripeEvent(
        "evt_mismatch",
        "checkout.session.completed",
        stripeCheckoutSession("cs_test_mismatch", order._id.toString(), payment._id.toString(), { amountTotal: 4000 })
      )
    );

    await request(app).post("/api/v1/webhooks/stripe").set("Stripe-Signature", "valid").set("Content-Type", "application/json").send({}).expect(200);

    expect(await PaymentModel.findById(payment._id).lean().exec()).toMatchObject({
      status: "FAILED",
      failureCode: "PAYMENT_VERIFICATION_FAILED"
    });
    expect(await OrderModel.findById(order._id).lean().exec()).toMatchObject({
      orderStatus: "PAYMENT_REVIEW",
      paymentStatus: "FAILED",
      paidAt: undefined
    });
    expect((await PaymentWebhookEventModel.findOne({ providerEventId: "evt_mismatch" }).lean().exec())?.processingStatus).toBe("FAILED");
  });

  it("moves provider session mismatches to review without marking paid", async () => {
    const { order, payment } = await seedOrderAndPayment();
    await PaymentModel.updateOne({ _id: payment._id }, { $set: { providerCheckoutSessionId: "cs_expected" } }).exec();
    mockedConstructStripeWebhookEvent.mockReturnValue(
      stripeEvent(
        "evt_provider_mismatch",
        "checkout.session.completed",
        stripeCheckoutSession("cs_unexpected", order._id.toString(), payment._id.toString())
      )
    );

    await request(app).post("/api/v1/webhooks/stripe").set("Stripe-Signature", "valid").set("Content-Type", "application/json").send({}).expect(200);

    expect(await PaymentModel.findById(payment._id).lean().exec()).toMatchObject({
      status: "FAILED",
      failureCode: "PAYMENT_VERIFICATION_FAILED"
    });
    expect(await OrderModel.findById(order._id).lean().exec()).toMatchObject({
      orderStatus: "PAYMENT_REVIEW",
      paymentStatus: "FAILED"
    });
  });

  it("marks unknown webhook events as ignored", async () => {
    mockedConstructStripeWebhookEvent.mockReturnValue(stripeEvent("evt_unknown", "customer.created", { id: "cus_123" }));

    await request(app).post("/api/v1/webhooks/stripe").set("Stripe-Signature", "valid").set("Content-Type", "application/json").send({}).expect(200);

    expect((await PaymentWebhookEventModel.findOne({ providerEventId: "evt_unknown" }).lean().exec())?.processingStatus).toBe("IGNORED");
  });

  it("keeps normal JSON API routes working after the raw webhook route", async () => {
    await request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${customerToken()}`).send({ shippingAddress }).expect(400);
  });
});
