import { Types } from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getConfig } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { CategoryModel } from "../src/modules/catalog/category.model.js";
import { ProductModel } from "../src/modules/catalog/product.model.js";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "./helpers/database.js";

const adminToken = (): string => signAccessToken(getConfig(), { sub: new Types.ObjectId().toString(), role: "ADMIN" });
const customerToken = (): string => signAccessToken(getConfig(), { sub: new Types.ObjectId().toString(), role: "CUSTOMER" });

const createCategory = (slug: string, status: "ACTIVE" | "INACTIVE" = "ACTIVE") =>
  CategoryModel.create({
    name: `Category ${slug}`,
    slug,
    description: `Description for ${slug}`,
    status
  });

const createProduct = (
  slug: string,
  categoryId: Types.ObjectId,
  overrides: Partial<{
    name: string;
    priceMinor: number;
    stockQuantity: number;
    status: "ACTIVE" | "INACTIVE";
  }> = {}
) =>
  ProductModel.create({
    name: overrides.name ?? `Product ${slug}`,
    slug,
    description: `A useful catalog product description for ${slug}.`,
    categoryId,
    priceMinor: overrides.priceMinor ?? 1000,
    stockQuantity: overrides.stockQuantity ?? 5,
    status: overrides.status ?? "ACTIVE",
    images: [{ url: `https://example.com/${slug}.png`, alt: `Product ${slug}` }]
  });

const validProductPayload = (categoryId: Types.ObjectId) => ({
  name: "Mechanical Gaming Keyboard",
  description: "A compact mechanical keyboard with tactile switches.",
  categoryId: categoryId.toString(),
  priceMinor: 8999,
  stockQuantity: 12,
  images: [{ url: "https://example.com/keyboard.png", alt: "Keyboard" }]
});

describe("catalog API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("lists only active public categories and lets admins filter categories by status", async () => {
    await createCategory("active-category");
    await createCategory("inactive-category", "INACTIVE");

    const publicResponse = await request(app).get("/api/v1/categories").expect(200);
    expect(publicResponse.body.data.categories.map((category: { slug: string }) => category.slug)).toEqual(["active-category"]);

    const adminResponse = await request(app)
      .get("/api/v1/admin/categories?status=INACTIVE")
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(200);
    expect(adminResponse.body.data.categories.map((category: { slug: string }) => category.slug)).toEqual(["inactive-category"]);
  });

  it("protects admin category routes", async () => {
    await request(app).post("/api/v1/admin/categories").send({ name: "Keyboards" }).expect(401);

    const forbidden = await request(app)
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${customerToken()}`)
      .send({ name: "Keyboards" })
      .expect(403);
    expect(forbidden.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("creates, updates and deactivates categories without physical delete", async () => {
    const created = await request(app)
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Gaming Keyboards", slug: "Gaming Keyboards" })
      .expect(201);
    expect(created.body.data.category.slug).toBe("gaming-keyboards");

    const duplicate = await request(app)
      .post("/api/v1/admin/categories")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Duplicate", slug: "gaming-keyboards" })
      .expect(409);
    expect(duplicate.body.error.code).toBe("CATEGORY_SLUG_EXISTS");

    const updated = await request(app)
      .patch(`/api/v1/admin/categories/${created.body.data.category.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Updated Keyboards" })
      .expect(200);
    expect(updated.body.data.category.name).toBe("Updated Keyboards");
    expect(updated.body.data.category.slug).toBe("gaming-keyboards");

    const deactivated = await request(app)
      .delete(`/api/v1/admin/categories/${created.body.data.category.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(200);
    expect(deactivated.body.data.category.status).toBe("INACTIVE");
    expect(await CategoryModel.findById(created.body.data.category.id).exec()).toBeTruthy();
  });

  it("blocks category deactivation while active products still use it", async () => {
    const category = await createCategory("occupied-category");
    await createProduct("active-category-product", category._id);

    const patchResponse = await request(app)
      .patch(`/api/v1/admin/categories/${category._id.toString()}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ status: "INACTIVE" })
      .expect(409);
    expect(patchResponse.body.error.code).toBe("CATEGORY_HAS_ACTIVE_PRODUCTS");

    const deleteResponse = await request(app)
      .delete(`/api/v1/admin/categories/${category._id.toString()}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(409);
    expect(deleteResponse.body.error.code).toBe("CATEGORY_HAS_ACTIVE_PRODUCTS");
  });

  it("allows category deactivation when it has no active products", async () => {
    const category = await createCategory("inactive-product-category");
    await createProduct("inactive-category-product", category._id, { status: "INACTIVE" });

    const deactivated = await request(app)
      .patch(`/api/v1/admin/categories/${category._id.toString()}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ status: "INACTIVE" })
      .expect(200);
    expect(deactivated.body.data.category.status).toBe("INACTIVE");
  });

  it("lists public products with active visibility, pagination, filters, escaped search and sort", async () => {
    const keyboards = await createCategory("keyboards");
    const mice = await createCategory("mice");
    const inactiveCategory = await createCategory("inactive-category", "INACTIVE");
    await createProduct("keyboard-pro", keyboards._id, { name: "Keyboard Pro", priceMinor: 9000 });
    await createProduct("keyboard-lite", keyboards._id, { name: "Keyboard Lite", priceMinor: 3000 });
    await createProduct("mouse-pro", mice._id, { name: "Mouse Pro", priceMinor: 5000 });
    await createProduct("inactive-product", keyboards._id, { status: "INACTIVE" });
    await createProduct("hidden-category-product", inactiveCategory._id);
    await createProduct("literal-search", keyboards._id, { name: "Keyboard [Pro]", priceMinor: 7000 });

    const response = await request(app)
      .get("/api/v1/products?page=1&limit=2&category=keyboards&minPriceMinor=6000&maxPriceMinor=9500&sort=price_desc&q=Keyboard%20[Pro]")
      .expect(200);

    expect(response.body.data.products.map((product: { slug: string }) => product.slug)).toEqual(["literal-search"]);
    expect(response.body.meta).toEqual({ page: 1, limit: 2, totalItems: 1, totalPages: 1 });

    const allPublic = await request(app).get("/api/v1/products?limit=50").expect(200);
    expect(allPublic.body.data.products.map((product: { slug: string }) => product.slug)).not.toContain("inactive-product");
    expect(allPublic.body.data.products.map((product: { slug: string }) => product.slug)).not.toContain("hidden-category-product");

    const invalidSort = await request(app).get("/api/v1/products?sort=raw_field").expect(400);
    expect(invalidSort.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns public product detail only for active products in active categories", async () => {
    const activeCategory = await createCategory("active-category");
    const inactiveCategory = await createCategory("inactive-category", "INACTIVE");
    await createProduct("visible-product", activeCategory._id);
    await createProduct("inactive-product", activeCategory._id, { status: "INACTIVE" });
    await createProduct("hidden-product", inactiveCategory._id);

    const visible = await request(app).get("/api/v1/products/visible-product").expect(200);
    expect(visible.body.data.product.slug).toBe("visible-product");

    const inactive = await request(app).get("/api/v1/products/inactive-product").expect(404);
    expect(inactive.body.error.code).toBe("PRODUCT_NOT_FOUND");

    const hidden = await request(app).get("/api/v1/products/hidden-product").expect(404);
    expect(hidden.body.error.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("protects admin product routes", async () => {
    await request(app).post("/api/v1/admin/products").send({}).expect(401);

    const forbidden = await request(app)
      .post("/api/v1/admin/products")
      .set("Authorization", `Bearer ${customerToken()}`)
      .send({})
      .expect(403);
    expect(forbidden.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("creates, updates and deactivates products with category and slug rules", async () => {
    const activeCategory = await createCategory("keyboards");
    const inactiveCategory = await createCategory("legacy", "INACTIVE");

    const invalidCategory = await request(app)
      .post("/api/v1/admin/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ ...validProductPayload(inactiveCategory._id), name: "Invalid Active Product" })
      .expect(400);
    expect(invalidCategory.body.error.code).toBe("PRODUCT_CATEGORY_INVALID");

    const created = await request(app)
      .post("/api/v1/admin/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send(validProductPayload(activeCategory._id))
      .expect(201);
    expect(created.body.data.product.slug).toBe("mechanical-gaming-keyboard");

    const duplicate = await request(app)
      .post("/api/v1/admin/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ ...validProductPayload(activeCategory._id), slug: "mechanical-gaming-keyboard" })
      .expect(409);
    expect(duplicate.body.error.code).toBe("PRODUCT_SLUG_EXISTS");

    const invalidMoney = await request(app)
      .post("/api/v1/admin/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ ...validProductPayload(activeCategory._id), name: "Bad Money", priceMinor: 10.5 })
      .expect(400);
    expect(invalidMoney.body.error.code).toBe("VALIDATION_ERROR");

    const unknownField = await request(app)
      .post("/api/v1/admin/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ ...validProductPayload(activeCategory._id), _id: new Types.ObjectId().toString() })
      .expect(400);
    expect(unknownField.body.error.code).toBe("VALIDATION_ERROR");

    const updatedName = await request(app)
      .patch(`/api/v1/admin/products/${created.body.data.product.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Renamed Keyboard" })
      .expect(200);
    expect(updatedName.body.data.product.name).toBe("Renamed Keyboard");
    expect(updatedName.body.data.product.slug).toBe("mechanical-gaming-keyboard");

    const updatedSlug = await request(app)
      .patch(`/api/v1/admin/products/${created.body.data.product.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ slug: "renamed-keyboard" })
      .expect(200);
    expect(updatedSlug.body.data.product.slug).toBe("renamed-keyboard");

    await ProductModel.findByIdAndUpdate(created.body.data.product.id, {
      $set: { status: "INACTIVE", categoryId: inactiveCategory._id }
    }).exec();

    const rejectedActivation = await request(app)
      .patch(`/api/v1/admin/products/${created.body.data.product.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ status: "ACTIVE" })
      .expect(400);
    expect(rejectedActivation.body.error.code).toBe("PRODUCT_CATEGORY_INVALID");

    const deactivated = await request(app)
      .delete(`/api/v1/admin/products/${created.body.data.product.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(200);
    expect(deactivated.body.data.product.status).toBe("INACTIVE");
    expect(await ProductModel.findById(created.body.data.product.id).exec()).toBeTruthy();
  });

  it("lets admins list active and inactive products", async () => {
    const category = await createCategory("keyboards");
    await createProduct("active-product", category._id);
    await createProduct("inactive-product", category._id, { status: "INACTIVE" });

    const inactive = await request(app)
      .get("/api/v1/admin/products?status=INACTIVE")
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(200);
    expect(inactive.body.data.products.map((product: { slug: string }) => product.slug)).toEqual(["inactive-product"]);
  });

  it("supports admin product detail, stock updates, status updates and stock filters", async () => {
    const category = await createCategory("keyboards");
    const inactiveCategory = await createCategory("legacy", "INACTIVE");
    const product = await createProduct("stocked-product", category._id, { stockQuantity: 8 });
    await createProduct("low-stock-product", category._id, { stockQuantity: 3 });
    await createProduct("out-product", category._id, { stockQuantity: 0 });

    const detail = await request(app)
      .get(`/api/v1/admin/products/${product._id.toString()}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(200);
    expect(detail.body.data.product.slug).toBe("stocked-product");

    const invalidStock = await request(app)
      .patch(`/api/v1/admin/products/${product._id.toString()}/stock`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ stockQuantity: 1.5 })
      .expect(400);
    expect(invalidStock.body.error.code).toBe("VALIDATION_ERROR");

    const unknownStockField = await request(app)
      .patch(`/api/v1/admin/products/${product._id.toString()}/stock`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ stockQuantity: 4, $inc: { stockQuantity: 99 } })
      .expect(400);
    expect(unknownStockField.body.error.code).toBe("VALIDATION_ERROR");

    const updatedStock = await request(app)
      .patch(`/api/v1/admin/products/${product._id.toString()}/stock`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ stockQuantity: 4 })
      .expect(200);
    expect(updatedStock.body.data.product.stockQuantity).toBe(4);

    const lowStock = await request(app)
      .get("/api/v1/admin/products?stockState=low_stock&limit=50")
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(200);
    expect(lowStock.body.data.products.map((item: { slug: string }) => item.slug)).toEqual(
      expect.arrayContaining(["stocked-product", "low-stock-product"])
    );

    await ProductModel.findByIdAndUpdate(product._id, {
      $set: { status: "INACTIVE", categoryId: inactiveCategory._id }
    }).exec();

    const rejectedActivation = await request(app)
      .patch(`/api/v1/admin/products/${product._id.toString()}/status`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ status: "ACTIVE" })
      .expect(400);
    expect(rejectedActivation.body.error.code).toBe("PRODUCT_CATEGORY_INVALID");
  });
});
