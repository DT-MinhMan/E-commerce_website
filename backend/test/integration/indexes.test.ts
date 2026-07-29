import { Types } from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { connectTestDatabase, clearTestDatabase, disconnectTestDatabase } from "../helpers/database.js";
import { CartModel } from "../../src/modules/cart/cart.model.js";
import { CategoryModel } from "../../src/modules/catalog/category.model.js";
import { ProductModel } from "../../src/modules/catalog/product.model.js";
import { OrderModel } from "../../src/modules/orders/order.model.js";
import { PaymentModel } from "../../src/modules/payments/payment.model.js";
import { PaymentWebhookEventModel } from "../../src/modules/payments/paymentWebhookEvent.model.js";
import { RefreshTokenModel } from "../../src/modules/users/refreshToken.model.js";
import { UserModel } from "../../src/modules/users/user.model.js";

const objectId = (): Types.ObjectId => new Types.ObjectId();

const userData = (email: string) => ({
  email,
  passwordHash: "$2a$10$hashhashhashhashhashhashhashhashhashhashhashhashha",
  fullName: "Demo User"
});

const categoryData = (slug: string) => ({
  name: `Category ${slug}`,
  slug
});

const productData = (slug: string, categoryId = objectId()) => ({
  name: `Product ${slug}`,
  slug,
  description: "A valid product description for index testing.",
  categoryId,
  priceMinor: 1000,
  stockQuantity: 5
});

const orderData = (orderNumber: string, userId = objectId()) => ({
  orderNumber,
  userId,
  items: [
    {
      productId: objectId(),
      productName: "Test Product",
      productSlug: "test-product",
      unitPriceMinor: 1000,
      quantity: 1,
      lineTotalMinor: 1000
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
  subtotalMinor: 1000,
  shippingFeeMinor: 0,
  totalMinor: 1000
});

describe("database unique indexes", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("rejects duplicate user email", async () => {
    await UserModel.create(userData("duplicate@example.com"));
    await expect(UserModel.create(userData("DUPLICATE@example.com"))).rejects.toThrow();
  });

  it("rejects duplicate category slug", async () => {
    await CategoryModel.create(categoryData("duplicate-category"));
    await expect(CategoryModel.create(categoryData("duplicate-category"))).rejects.toThrow();
  });

  it("rejects duplicate product slug", async () => {
    await ProductModel.create(productData("duplicate-product"));
    await expect(ProductModel.create(productData("duplicate-product"))).rejects.toThrow();
  });

  it("rejects duplicate cart userId", async () => {
    const userId = objectId();
    await CartModel.create({ userId, items: [] });
    await expect(CartModel.create({ userId, items: [] })).rejects.toThrow();
  });

  it("rejects duplicate order number", async () => {
    await OrderModel.create(orderData("ORD-DUPLICATE-001"));
    await expect(OrderModel.create(orderData("ORD-DUPLICATE-001"))).rejects.toThrow();
  });

  it("rejects duplicate payment orderId", async () => {
    const orderId = objectId();
    await PaymentModel.create({ orderId, userId: objectId(), amountMinor: 1000 });
    await expect(PaymentModel.create({ orderId, userId: objectId(), amountMinor: 1000 })).rejects.toThrow();
  });

  it("allows missing provider IDs but rejects duplicate provider IDs when present", async () => {
    await PaymentModel.create({ orderId: objectId(), userId: objectId(), amountMinor: 1000 });
    await PaymentModel.create({ orderId: objectId(), userId: objectId(), amountMinor: 1000 });

    await PaymentModel.create({
      orderId: objectId(),
      userId: objectId(),
      amountMinor: 1000,
      providerPaymentId: "pi_duplicate",
      providerCheckoutSessionId: "cs_duplicate"
    });

    await expect(
      PaymentModel.create({ orderId: objectId(), userId: objectId(), amountMinor: 1000, providerPaymentId: "pi_duplicate" })
    ).rejects.toThrow();
    await expect(
      PaymentModel.create({
        orderId: objectId(),
        userId: objectId(),
        amountMinor: 1000,
        providerCheckoutSessionId: "cs_duplicate"
      })
    ).rejects.toThrow();
  });

  it("rejects duplicate provider event ID", async () => {
    await PaymentWebhookEventModel.create({ providerEventId: "evt_duplicate", eventType: "checkout.session.completed", payload: {} });
    await expect(
      PaymentWebhookEventModel.create({ providerEventId: "evt_duplicate", eventType: "checkout.session.completed", payload: {} })
    ).rejects.toThrow();
  });

  it("rejects duplicate refresh token hash", async () => {
    await RefreshTokenModel.create({ userId: objectId(), tokenHash: "duplicate-token-hash", expiresAt: new Date(Date.now() + 1000) });
    await expect(
      RefreshTokenModel.create({ userId: objectId(), tokenHash: "duplicate-token-hash", expiresAt: new Date(Date.now() + 1000) })
    ).rejects.toThrow();
  });
});
