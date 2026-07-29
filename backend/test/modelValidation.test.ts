import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { CartModel } from "../src/modules/cart/cart.model.js";
import { CategoryModel } from "../src/modules/catalog/category.model.js";
import { ProductModel } from "../src/modules/catalog/product.model.js";
import { OrderModel } from "../src/modules/orders/order.model.js";
import { PaymentModel } from "../src/modules/payments/payment.model.js";
import { PaymentWebhookEventModel } from "../src/modules/payments/paymentWebhookEvent.model.js";
import { RefreshTokenModel } from "../src/modules/users/refreshToken.model.js";
import { UserModel } from "../src/modules/users/user.model.js";

const objectId = (): Types.ObjectId => new Types.ObjectId();

const validUser = (): InstanceType<typeof UserModel> =>
  new UserModel({
    email: "USER@Example.COM",
    passwordHash: "$2a$10$hashhashhashhashhashhashhashhashhashhashhashhashha",
    fullName: "Demo User"
  });

const validCategory = (): InstanceType<typeof CategoryModel> =>
  new CategoryModel({
    name: "Keyboards",
    slug: "keyboards"
  });

const validProduct = (): InstanceType<typeof ProductModel> =>
  new ProductModel({
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    description: "A durable keyboard for focused typing and gaming.",
    categoryId: objectId(),
    priceMinor: 8999,
    stockQuantity: 10
  });

const validOrder = (): InstanceType<typeof OrderModel> =>
  new OrderModel({
    orderNumber: "ORD-TEST-001",
    userId: objectId(),
    items: [
      {
        productId: objectId(),
        productName: "Mechanical Keyboard",
        productSlug: "mechanical-keyboard",
        unitPriceMinor: 8999,
        quantity: 1,
        lineTotalMinor: 8999
      }
    ],
    shippingAddress: {
      recipientName: "Demo User",
      phone: "1234567890",
      addressLine1: "123 Test Street",
      city: "Test City",
      stateOrProvince: "Test State",
      postalCode: "12345",
      countryCode: "US"
    },
    subtotalMinor: 8999,
    shippingFeeMinor: 0,
    totalMinor: 8999
  });

describe("model validation", () => {
  it("normalizes user email and hides passwordHash from JSON", async () => {
    const user = validUser();
    await expect(user.validate()).resolves.toBeUndefined();

    expect(user.email).toBe("user@example.com");
    expect(user.toJSON()).not.toHaveProperty("passwordHash");
  });

  it("rejects invalid user email and role", async () => {
    await expect(validUser().set("email", "not-email").validate()).rejects.toThrow();
    await expect(validUser().set("role", "OWNER").validate()).rejects.toThrow();
  });

  it("requires category slug and rejects invalid category status", async () => {
    await expect(validCategory().set("slug", undefined).validate()).rejects.toThrow();
    await expect(validCategory().set("slug", "Bad Slug").validate()).rejects.toThrow();
    await expect(validCategory().set("status", "DRAFT").validate()).rejects.toThrow();
  });

  it("rejects invalid product money, stock, currency and status", async () => {
    await expect(validProduct().set("priceMinor", -1).validate()).rejects.toThrow();
    await expect(validProduct().set("priceMinor", 19.99).validate()).rejects.toThrow();
    await expect(validProduct().set("stockQuantity", -1).validate()).rejects.toThrow();
    await expect(validProduct().set("stockQuantity", 1.5).validate()).rejects.toThrow();
    await expect(validProduct().set("currency", "US").validate()).rejects.toThrow();
    await expect(validProduct().set("status", "ARCHIVED").validate()).rejects.toThrow();
  });

  it("rejects invalid cart item quantity and missing user", async () => {
    await expect(new CartModel({ userId: objectId(), items: [{ productId: objectId(), quantity: 0 }] }).validate()).rejects.toThrow();
    await expect(new CartModel({ userId: objectId(), items: [{ productId: objectId(), quantity: 1.5 }] }).validate()).rejects.toThrow();
    await expect(new CartModel({ items: [] }).validate()).rejects.toThrow();
  });

  it("rejects duplicate products in one cart", async () => {
    const productId = objectId();
    await expect(
      new CartModel({
        userId: objectId(),
        items: [
          { productId, quantity: 1 },
          { productId, quantity: 2 }
        ]
      }).validate()
    ).rejects.toThrow();
  });

  it("validates order snapshots and status fields", async () => {
    await expect(validOrder().set("items", []).validate()).rejects.toThrow();
    await expect(validOrder().set("totalMinor", -1).validate()).rejects.toThrow();
    await expect(validOrder().set("orderStatus", "DRAFT").validate()).rejects.toThrow();
    await expect(validOrder().set("paymentStatus", "UNKNOWN").validate()).rejects.toThrow();
    await expect(validOrder().set("items.0.productName", undefined).validate()).rejects.toThrow();
  });

  it("validates payment fields", async () => {
    const payment = new PaymentModel({ orderId: objectId(), userId: objectId(), amountMinor: 1000 });
    await expect(payment.validate()).resolves.toBeUndefined();
    await expect(payment.set("amountMinor", -1).validate()).rejects.toThrow();
    await expect(payment.set("provider", "PAYPAL").validate()).rejects.toThrow();
    await expect(payment.set("status", "VOID").validate()).rejects.toThrow();
  });

  it("validates webhook event fields", async () => {
    await expect(
      new PaymentWebhookEventModel({ providerEventId: "evt_1", eventType: "checkout.session.completed", payload: {} }).validate()
    ).resolves.toBeUndefined();
    await expect(new PaymentWebhookEventModel({ eventType: "checkout.session.completed", payload: {} }).validate()).rejects.toThrow();
    await expect(
      new PaymentWebhookEventModel({ providerEventId: "evt_1", eventType: "event", payload: {}, retryCount: -1 }).validate()
    ).rejects.toThrow();
    await expect(
      new PaymentWebhookEventModel({ providerEventId: "evt_1", eventType: "event", payload: {}, processingStatus: "DONE" }).validate()
    ).rejects.toThrow();
  });

  it("validates refresh token required fields", async () => {
    await expect(new RefreshTokenModel({ userId: objectId(), tokenHash: "hash", expiresAt: new Date() }).validate()).resolves.toBeUndefined();
    await expect(new RefreshTokenModel({ userId: objectId(), expiresAt: new Date() }).validate()).rejects.toThrow();
    await expect(new RefreshTokenModel({ userId: objectId(), tokenHash: "hash" }).validate()).rejects.toThrow();
  });
});
