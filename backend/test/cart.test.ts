import { Types } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getConfig } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { CartModel } from "../src/modules/cart/cart.model.js";
import { CategoryModel } from "../src/modules/catalog/category.model.js";
import { ProductModel } from "../src/modules/catalog/product.model.js";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "./helpers/database.js";

const customerId = () => new Types.ObjectId();
const customerToken = (userId = customerId()): string => signAccessToken(getConfig(), { sub: userId.toString(), role: "CUSTOMER" });
const adminToken = (): string => signAccessToken(getConfig(), { sub: new Types.ObjectId().toString(), role: "ADMIN" });

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

describe("cart API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("returns an empty cart for authenticated customers", async () => {
    const response = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${customerToken()}`).expect(200);

    expect(response.body.data.cart).toEqual({
      id: null,
      items: [],
      itemCount: 0,
      subtotalMinor: 0,
      currency: "USD"
    });
  });

  it("protects cart routes for customers only", async () => {
    await request(app).get("/api/v1/cart").expect(401);

    const forbidden = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${adminToken()}`).expect(403);
    expect(forbidden.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("adds first item, increments an existing item, updates quantity, removes item and clears cart", async () => {
    const userId = customerId();
    const token = customerToken(userId);
    const product = await createProduct({ stockQuantity: 10 });

    const added = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 2 })
      .expect(200);
    expect(added.body.data.cart.itemCount).toBe(2);
    expect(added.body.data.cart.subtotalMinor).toBe(17998);
    expect(added.body.data.cart.items[0]).toMatchObject({
      productId: product._id.toString(),
      slug: product.slug,
      name: product.name,
      unitPriceMinor: 8999,
      currency: "USD",
      quantity: 2,
      lineTotalMinor: 17998,
      stockQuantity: 10,
      isAvailable: true
    });

    const incremented = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 3 })
      .expect(200);
    expect(incremented.body.data.cart.itemCount).toBe(5);
    expect(incremented.body.data.cart.items).toHaveLength(1);
    expect(await CartModel.countDocuments({ userId })).toBe(1);

    const updated = await request(app)
      .patch(`/api/v1/cart/items/${product._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ quantity: 4 })
      .expect(200);
    expect(updated.body.data.cart.itemCount).toBe(4);

    const removed = await request(app)
      .delete(`/api/v1/cart/items/${product._id.toString()}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(removed.body.data.cart.items).toEqual([]);

    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 1 })
      .expect(200);
    const cleared = await request(app).delete("/api/v1/cart").set("Authorization", `Bearer ${token}`).expect(200);
    expect(cleared.body.data.cart.items).toEqual([]);
  });

  it("rejects invalid products, inactive products, invalid quantities and insufficient stock", async () => {
    const token = customerToken();
    const active = await createProduct({ stockQuantity: 2 });
    const inactive = await createProduct({ status: "INACTIVE" });
    const missingId = new Types.ObjectId().toString();

    const invalidQuantity = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: active._id.toString(), quantity: 0 })
      .expect(400);
    expect(invalidQuantity.body.error.code).toBe("CART_INVALID_QUANTITY");

    const missing = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: missingId, quantity: 1 })
      .expect(404);
    expect(missing.body.error.code).toBe("CART_PRODUCT_NOT_FOUND");

    const inactiveResponse = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: inactive._id.toString(), quantity: 1 })
      .expect(400);
    expect(inactiveResponse.body.error.code).toBe("CART_PRODUCT_INACTIVE");

    const insufficient = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: active._id.toString(), quantity: 3 })
      .expect(409);
    expect(insufficient.body.error.code).toBe("CART_INSUFFICIENT_STOCK");
  });

  it("rejects adding products with a different currency", async () => {
    const token = customerToken();
    const usdProduct = await createProduct({ currency: "USD" });
    const eurProduct = await createProduct({ currency: "EUR" });

    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: usdProduct._id.toString(), quantity: 1 })
      .expect(200);

    const mismatch = await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: eurProduct._id.toString(), quantity: 1 })
      .expect(409);
    expect(mismatch.body.error.code).toBe("CART_CURRENCY_MISMATCH");
  });

  it("isolates carts by user", async () => {
    const firstUserId = customerId();
    const secondUserId = customerId();
    const product = await createProduct();

    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${customerToken(firstUserId)}`)
      .send({ productId: product._id.toString(), quantity: 2 })
      .expect(200);

    const secondCart = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${customerToken(secondUserId)}`).expect(200);
    expect(secondCart.body.data.cart.items).toEqual([]);
  });

  it("marks existing cart items unavailable without deleting them", async () => {
    const userId = customerId();
    const token = customerToken(userId);
    const product = await createProduct({ stockQuantity: 5 });

    await request(app)
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: product._id.toString(), quantity: 3 })
      .expect(200);

    await ProductModel.findByIdAndUpdate(product._id, { $set: { stockQuantity: 1 } }).exec();

    const response = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${token}`).expect(200);
    expect(response.body.data.cart.items[0]).toMatchObject({
      productId: product._id.toString(),
      quantity: 3,
      stockQuantity: 1,
      isAvailable: false,
      lineTotalMinor: 0
    });
    expect(response.body.data.cart.itemCount).toBe(3);
    expect(response.body.data.cart.subtotalMinor).toBe(0);
    expect((await CartModel.findOne({ userId }).lean().exec())?.items).toHaveLength(1);
  });
});
