import bcrypt from "bcryptjs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedDatabase } from "../../src/database/seed.js";
import { CategoryModel, ProductModel, UserModel } from "../../src/database/models.js";
import { connectTestDatabase, clearTestDatabase, disconnectTestDatabase } from "../helpers/database.js";

describe("database seed", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("runs idempotently and creates demo data", async () => {
    await seedDatabase();

    const firstUserCount = await UserModel.countDocuments();
    const firstCategoryCount = await CategoryModel.countDocuments();
    const firstProductCount = await ProductModel.countDocuments();

    await seedDatabase();

    expect(await UserModel.countDocuments()).toBe(firstUserCount);
    expect(await CategoryModel.countDocuments()).toBe(firstCategoryCount);
    expect(await ProductModel.countDocuments()).toBe(firstProductCount);

    const admin = await UserModel.findOne({ email: "admin@example.com" }).select("+passwordHash").exec();
    const customer = await UserModel.findOne({ email: "customer@example.com" }).select("+passwordHash").exec();
    expect(admin?.role).toBe("ADMIN");
    expect(customer?.role).toBe("CUSTOMER");
    expect(admin?.passwordHash).toBeDefined();
    expect(admin?.passwordHash).not.toBe("ChangeMe123!");
    expect(admin ? await bcrypt.compare("ChangeMe123!", admin.passwordHash) : false).toBe(true);

    const inactiveProduct = await ProductModel.findOne({ status: "INACTIVE" }).exec();
    const outOfStockProduct = await ProductModel.findOne({ stockQuantity: 0 }).exec();
    const lowStockProduct = await ProductModel.findOne({ stockQuantity: { $gt: 0, $lte: 3 } }).exec();
    const highStockProduct = await ProductModel.findOne({ stockQuantity: { $gte: 20 } }).exec();

    expect(inactiveProduct).toBeTruthy();
    expect(outOfStockProduct).toBeTruthy();
    expect(lowStockProduct).toBeTruthy();
    expect(highStockProduct).toBeTruthy();

    const products = await ProductModel.find().lean().exec();
    const categoryIds = new Set((await CategoryModel.find().select("_id").lean().exec()).map((category) => category._id.toString()));

    expect(products.every((product) => Number.isInteger(product.priceMinor))).toBe(true);
    expect(products.every((product) => categoryIds.has(product.categoryId.toString()))).toBe(true);
  });
});
