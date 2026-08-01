import { Types } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { getConfig } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { CartModel } from "../src/modules/cart/cart.model.js";
import { CategoryModel } from "../src/modules/catalog/category.model.js";
import { ProductModel } from "../src/modules/catalog/product.model.js";
import { OrderModel } from "../src/modules/orders/order.model.js";
import { PaymentModel } from "../src/modules/payments/payment.model.js";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "./helpers/database.js";

const customerId = () => new Types.ObjectId();
const customerToken = (userId = customerId()): string => signAccessToken(getConfig(), { sub: userId.toString(), role: "CUSTOMER" });
const adminToken = (): string => signAccessToken(getConfig(), { sub: new Types.ObjectId().toString(), role: "ADMIN" });

const shippingAddress = {
  recipientName: "Demo Customer",
  phone: "1234567890",
  addressLine1: "123 Test Street",
  addressLine2: "Unit 4",
  city: "Test City",
  stateOrProvince: "Test State",
  postalCode: "12345",
  countryCode: "US"
};

const createCategory = () =>
  CategoryModel.create({
    name: "Keyboards",
    slug: `keyboards-${new Types.ObjectId().toString()}`,
    description: "Mechanical and productivity keyboards.",
    status: "ACTIVE"
  });

const createProduct = async (
  overrides: Partial<{
    name: string;
    slug: string;
    priceMinor: number;
    currency: string;
    stockQuantity: number;
    status: "ACTIVE" | "INACTIVE";
  }> = {}
) => {
  const category = await createCategory();

  return ProductModel.create({
    name: overrides.name ?? "Mechanical Keyboard",
    slug: overrides.slug ?? `mechanical-keyboard-${new Types.ObjectId().toString()}`,
    description: "A compact keyboard with tactile switches.",
    categoryId: category._id,
    priceMinor: overrides.priceMinor ?? 8999,
    currency: overrides.currency ?? "USD",
    stockQuantity: overrides.stockQuantity ?? 10,
    status: overrides.status ?? "ACTIVE",
    images: [{ url: "https://example.com/keyboard.png", alt: "Keyboard" }]
  });
};

const seedCart = async (userId: Types.ObjectId, items: { productId: Types.ObjectId; quantity: number }[]) =>
  CartModel.create({
    userId,
    items
  });

describe("orders API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    vi.restoreAllMocks();
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("protects order routes for customers only", async () => {
    await request(app).get("/api/v1/orders").expect(401);

    const forbidden = await request(app).get("/api/v1/orders").set("Authorization", `Bearer ${adminToken()}`).expect(403);
    expect(forbidden.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("creates a pending order and payment from the current cart and clears the cart", async () => {
    const userId = customerId();
    const product = await createProduct({ priceMinor: 5000, stockQuantity: 4 });
    await seedCart(userId, [{ productId: product._id, quantity: 2 }]);

    const response = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .send({ shippingAddress })
      .expect(201);

    const order = response.body.data.order;
    expect(order).toMatchObject({
      orderNumber: expect.stringMatching(/^ORD-\d{8}-\d{6}$/),
      subtotalMinor: 10000,
      shippingFeeMinor: 0,
      totalMinor: 10000,
      currency: "USD",
      orderStatus: "PENDING_PAYMENT",
      paymentStatus: "PENDING",
      shippingAddress
    });
    expect(order.items[0]).toMatchObject({
      productId: product._id.toString(),
      productName: product.name,
      productSlug: product.slug,
      productImage: { url: "https://example.com/keyboard.png" },
      unitPriceMinor: 5000,
      quantity: 2,
      lineTotalMinor: 10000
    });

    const payment = await PaymentModel.findOne({ orderId: order.id }).lean().exec();
    expect(payment).toMatchObject({
      userId,
      provider: "STRIPE",
      amountMinor: 10000,
      currency: "USD",
      status: "PENDING"
    });
    expect((await CartModel.findOne({ userId }).lean().exec())?.items).toEqual([]);
    expect((await ProductModel.findById(product._id).lean().exec())?.stockQuantity).toBe(2);
  });

  it("uses immutable order snapshots after product changes", async () => {
    const userId = customerId();
    const product = await createProduct({ name: "Original Keyboard", priceMinor: 7000 });
    await seedCart(userId, [{ productId: product._id, quantity: 1 }]);

    const checkout = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .send({ shippingAddress })
      .expect(201);

    await ProductModel.findByIdAndUpdate(product._id, { $set: { name: "Renamed Keyboard", priceMinor: 9999 } }).exec();

    const detail = await request(app)
      .get(`/api/v1/orders/${checkout.body.data.order.id}`)
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .expect(200);

    expect(detail.body.data.order.items[0]).toMatchObject({
      productName: "Original Keyboard",
      unitPriceMinor: 7000
    });
  });

  it("rejects invalid checkout states", async () => {
    const userId = customerId();
    const token = customerToken(userId);
    const active = await createProduct({ stockQuantity: 1 });
    const inactive = await createProduct({ status: "INACTIVE" });
    const eurProduct = await createProduct({ currency: "EUR" });

    const empty = await request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${token}`).send({ shippingAddress }).expect(400);
    expect(empty.body.error.code).toBe("CHECKOUT_CART_EMPTY");

    await seedCart(userId, [{ productId: new Types.ObjectId(), quantity: 1 }]);
    const missing = await request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${token}`).send({ shippingAddress }).expect(404);
    expect(missing.body.error.code).toBe("CHECKOUT_PRODUCT_NOT_FOUND");

    await CartModel.updateOne({ userId }, { $set: { items: [{ productId: inactive._id, quantity: 1 }] } }).exec();
    const inactiveResponse = await request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${token}`).send({ shippingAddress }).expect(400);
    expect(inactiveResponse.body.error.code).toBe("CHECKOUT_PRODUCT_INACTIVE");

    await CartModel.updateOne({ userId }, { $set: { items: [{ productId: active._id, quantity: 2 }] } }).exec();
    const insufficient = await request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${token}`).send({ shippingAddress }).expect(409);
    expect(insufficient.body.error.code).toBe("CHECKOUT_INSUFFICIENT_STOCK");

    await CartModel.updateOne(
      { userId },
      {
        $set: {
          items: [
            { productId: active._id, quantity: 1 },
            { productId: eurProduct._id, quantity: 1 }
          ]
        }
      }
    ).exec();
    const mismatch = await request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${token}`).send({ shippingAddress }).expect(409);
    expect(mismatch.body.error.code).toBe("CHECKOUT_CURRENCY_MISMATCH");
  });

  it("rejects invalid shipping addresses", async () => {
    const userId = customerId();
    const product = await createProduct();
    await seedCart(userId, [{ productId: product._id, quantity: 1 }]);

    const response = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .send({ shippingAddress: { ...shippingAddress, countryCode: "USA" } })
      .expect(400);

    expect(response.body.error.code).toBe("CHECKOUT_INVALID_ADDRESS");
  });

  it("rolls back order and payment when checkout transaction fails", async () => {
    const userId = customerId();
    const product = await createProduct({ stockQuantity: 5 });
    await seedCart(userId, [{ productId: product._id, quantity: 1 }]);
    vi.spyOn(PaymentModel, "create").mockRejectedValueOnce(new Error("forced payment failure"));

    const response = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .send({ shippingAddress })
      .expect(500);

    expect(response.body.error.code).toBe("CHECKOUT_TRANSACTION_FAILED");
    expect(await OrderModel.countDocuments({ userId })).toBe(0);
    expect(await PaymentModel.countDocuments({ userId })).toBe(0);
    expect((await CartModel.findOne({ userId }).lean().exec())?.items).toHaveLength(1);
    expect((await ProductModel.findById(product._id).lean().exec())?.stockQuantity).toBe(5);
  });

  it("rolls back when stock becomes insufficient inside the checkout transaction", async () => {
    const userId = customerId();
    const product = await createProduct({ stockQuantity: 1 });
    await seedCart(userId, [{ productId: product._id, quantity: 1 }]);
    vi.spyOn(ProductModel, "updateOne").mockReturnValueOnce({
      exec: async () => ({ modifiedCount: 0 })
    } as ReturnType<typeof ProductModel.updateOne>);

    const response = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken(userId)}`)
      .send({ shippingAddress })
      .expect(409);

    expect(response.body.error.code).toBe("CHECKOUT_INSUFFICIENT_STOCK");
    expect(await OrderModel.countDocuments({ userId })).toBe(0);
    expect(await PaymentModel.countDocuments({ userId })).toBe(0);
    expect((await CartModel.findOne({ userId }).lean().exec())?.items).toHaveLength(1);
    expect((await ProductModel.findById(product._id).lean().exec())?.stockQuantity).toBe(1);
  });

  it("allows only one checkout to consume the last unit of stock", async () => {
    const firstUserId = customerId();
    const secondUserId = customerId();
    const product = await createProduct({ stockQuantity: 1 });
    await seedCart(firstUserId, [{ productId: product._id, quantity: 1 }]);
    await seedCart(secondUserId, [{ productId: product._id, quantity: 1 }]);

    const responses = await Promise.all([
      request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${customerToken(firstUserId)}`).send({ shippingAddress }),
      request(app).post("/api/v1/orders/checkout").set("Authorization", `Bearer ${customerToken(secondUserId)}`).send({ shippingAddress })
    ]);

    const successResponses = responses.filter((response) => response.status === 201);
    const failureResponses = responses.filter((response) => response.status === 409);
    expect(successResponses).toHaveLength(1);
    expect(failureResponses).toHaveLength(1);
    expect(failureResponses[0]?.body.error.code).toBe("CHECKOUT_INSUFFICIENT_STOCK");
    expect(await OrderModel.countDocuments()).toBe(1);
    expect(await PaymentModel.countDocuments()).toBe(1);
    expect((await ProductModel.findById(product._id).lean().exec())?.stockQuantity).toBe(0);

    const failedUserId = successResponses[0]?.body.data.order.id
      ? (await OrderModel.exists({ _id: successResponses[0].body.data.order.id, userId: firstUserId }).exec())
        ? secondUserId
        : firstUserId
      : firstUserId;
    expect((await CartModel.findOne({ userId: failedUserId }).lean().exec())?.items).toHaveLength(1);
  });

  it("lists and reads only the current customer's orders", async () => {
    const firstUserId = customerId();
    const secondUserId = customerId();
    const product = await createProduct({ priceMinor: 1000 });

    await seedCart(firstUserId, [{ productId: product._id, quantity: 1 }]);
    const firstOrder = await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken(firstUserId)}`)
      .send({ shippingAddress })
      .expect(201);

    await seedCart(secondUserId, [{ productId: product._id, quantity: 1 }]);
    await request(app)
      .post("/api/v1/orders/checkout")
      .set("Authorization", `Bearer ${customerToken(secondUserId)}`)
      .send({ shippingAddress })
      .expect(201);

    const list = await request(app).get("/api/v1/orders?page=1&limit=1").set("Authorization", `Bearer ${customerToken(firstUserId)}`).expect(200);
    expect(list.body.data.orders).toHaveLength(1);
    expect(list.body.data.orders[0].id).toBe(firstOrder.body.data.order.id);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 1, totalItems: 1, totalPages: 1 });

    await request(app).get(`/api/v1/orders/${firstOrder.body.data.order.id}`).set("Authorization", `Bearer ${customerToken(secondUserId)}`).expect(404);
  });
});
