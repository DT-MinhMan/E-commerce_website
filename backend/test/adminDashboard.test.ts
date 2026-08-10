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

describe("adminDashboard API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("requires authentication for dashboard summary", async () => {
    await request(app).get("/api/v1/admin/dashboard/summary").expect(401);
  });

  it("denies access to non-admin users", async () => {
    const response = await request(app)
      .get("/api/v1/admin/dashboard/summary")
      .set("Authorization", `Bearer ${customerToken()}`)
      .expect(403);

    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("returns admin dashboard summary with low stock products and status counts", async () => {
    const category = await CategoryModel.create({
      name: "Electronics",
      slug: "electronics",
      description: "Electronic items"
    });

    await ProductModel.create({
      name: "Low Stock Keyboard",
      slug: "low-stock-keyboard",
      description: "A keyboard with very low stock.",
      categoryId: category._id,
      priceMinor: 5000,
      stockQuantity: 2,
      status: "ACTIVE"
    });

    const response = await request(app)
      .get("/api/v1/admin/dashboard/summary")
      .set("Authorization", `Bearer ${adminToken()}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.summary).toBeDefined();
    expect(response.body.data.summary.totalOrders).toBe(0);
    expect(response.body.data.summary.paidRevenueMinor).toBe(0);
    expect(response.body.data.summary.currency).toBe("USD");
    expect(Array.isArray(response.body.data.summary.ordersByStatus)).toBe(true);
    expect(Array.isArray(response.body.data.summary.lowStockProducts)).toBe(true);
    expect(response.body.data.summary.lowStockProducts.length).toBe(1);
    expect(response.body.data.summary.lowStockProducts[0].name).toBe("Low Stock Keyboard");
  });
});
