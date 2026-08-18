import mongoose, { Types, type FilterQuery, type SortOrder } from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import { CategoryModel, type Category } from "./category.model.js";
import { ProductModel, type Product, type ProductImage } from "./product.model.js";
import type {
  CategoryInput,
  CategoryListQuery,
  CategoryUpdateInput,
  PaginationMeta,
  ProductInput,
  ProductListQuery,
  ProductStatusUpdateInput,
  ProductStockUpdateInput,
  ProductUpdateInput
} from "./catalog.types.js";

interface CategoryRecord extends Category {
  _id: Types.ObjectId;
}

interface ProductRecord extends Product {
  _id: Types.ObjectId;
}

interface PaginatedProducts {
  products: ProductResponse[];
  meta: PaginationMeta;
}

interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  roomType?: string;
  priceMinor: number;
  currency: string;
  stockQuantity: number;
  images: ProductImage[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const isDuplicateKeyError = (error: unknown): boolean =>
  error instanceof mongoose.mongo.MongoServerError && error.code === 11000;

const isValidationError = (error: unknown): boolean => error instanceof mongoose.Error.ValidationError;

const mapCategoryWriteError = (error: unknown): never => {
  if (isDuplicateKeyError(error)) {
    throw new AppError(409, "CATEGORY_SLUG_EXISTS", "Category slug already exists");
  }

  if (isValidationError(error)) {
    throw new AppError(400, "VALIDATION_ERROR", "Category validation failed");
  }

  throw error;
};

const mapProductWriteError = (error: unknown): never => {
  if (isDuplicateKeyError(error)) {
    throw new AppError(409, "PRODUCT_SLUG_EXISTS", "Product slug already exists");
  }

  if (isValidationError(error)) {
    throw new AppError(400, "VALIDATION_ERROR", "Product validation failed");
  }

  throw error;
};

const toCategoryResponse = (category: CategoryRecord): CategoryResponse => ({
  id: category._id.toString(),
  name: category.name,
  slug: category.slug,
  description: category.description,
  imageUrl: category.imageUrl,
  status: category.status,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt
});

const toProductResponse = (product: ProductRecord): ProductResponse => ({
  id: product._id.toString(),
  name: product.name,
  slug: product.slug,
  description: product.description,
  categoryId: product.categoryId.toString(),
  roomType: product.roomType,
  priceMinor: product.priceMinor,
  currency: product.currency,
  stockQuantity: product.stockQuantity,
  images: product.images,
  status: product.status,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt
});

const categorySelect = "_id name slug description imageUrl status createdAt updatedAt";
const productSelect = "_id name slug description categoryId roomType priceMinor currency stockQuantity images status createdAt updatedAt";
const lowStockThreshold = 5;

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getProductSort = (sort: ProductListQuery["sort"]): Record<string, SortOrder> => {
  if (sort === "price_asc") {
    return { priceMinor: 1, createdAt: -1 };
  }

  if (sort === "price_desc") {
    return { priceMinor: -1, createdAt: -1 };
  }

  return { createdAt: -1 };
};

const getPaginationMeta = (query: ProductListQuery, totalItems: number): PaginationMeta => ({
  page: query.page,
  limit: query.limit,
  totalItems,
  totalPages: Math.ceil(totalItems / query.limit)
});

const getActiveCategoryIds = async (): Promise<Types.ObjectId[]> => {
  const categories = await CategoryModel.find({ status: "ACTIVE" }).select("_id").lean<CategoryRecord[]>().exec();
  return categories.map((category) => category._id);
};

const resolveActiveCategoryIdBySlug = async (slug: string): Promise<Types.ObjectId | null> => {
  const category = await CategoryModel.findOne({ slug, status: "ACTIVE" }).select("_id").lean<CategoryRecord>().exec();
  return category?._id ?? null;
};

const resolveCategoryIdBySlug = async (slug: string): Promise<Types.ObjectId | null> => {
  const category = await CategoryModel.findOne({ slug }).select("_id").lean<CategoryRecord>().exec();
  return category?._id ?? null;
};

const buildProductListFilter = async (query: ProductListQuery, publicOnly: boolean): Promise<FilterQuery<Product>> => {
  const filter: FilterQuery<Product> = {};

  if (publicOnly) {
    filter.status = "ACTIVE";
    if (query.category) {
      const categoryId = await resolveActiveCategoryIdBySlug(query.category);
      filter.categoryId = categoryId ?? { $in: [] };
    } else {
      filter.categoryId = { $in: await getActiveCategoryIds() };
    }
  } else {
    if (query.status) {
      filter.status = query.status;
    }

    if (query.category) {
      const categoryId = await resolveCategoryIdBySlug(query.category);
      filter.categoryId = categoryId ?? { $in: [] };
    }
  }

  if (query.roomType) {
    filter.roomType = query.roomType;
  }

  if (!publicOnly && query.stockState) {
    if (query.stockState === "out_of_stock") {
      filter.stockQuantity = 0;
    } else if (query.stockState === "low_stock") {
      filter.stockQuantity = { $gt: 0, $lte: lowStockThreshold };
    } else {
      filter.stockQuantity = { $gt: 0 };
    }
  }

  if (query.minPriceMinor !== undefined || query.maxPriceMinor !== undefined) {
    filter.priceMinor = {};

    if (query.minPriceMinor !== undefined) {
      filter.priceMinor.$gte = query.minPriceMinor;
    }

    if (query.maxPriceMinor !== undefined) {
      filter.priceMinor.$lte = query.maxPriceMinor;
    }
  }

  if (query.q) {
    const pattern = { $regex: escapeRegex(query.q), $options: "i" };
    filter.$or = [{ name: pattern }, { description: pattern }];
  }

  return filter;
};

const assertCategoryUsableForProduct = async (categoryId: string, nextProductStatus: string): Promise<void> => {
  const category = await CategoryModel.findById(categoryId).select("_id status").lean<CategoryRecord>().exec();

  if (!category || (nextProductStatus === "ACTIVE" && category.status !== "ACTIVE")) {
    throw new AppError(400, "PRODUCT_CATEGORY_INVALID", "Product category is invalid");
  }
};

const assertCategoryCanBecomeInactive = async (categoryId: string): Promise<void> => {
  const activeProductCount = await ProductModel.countDocuments({ categoryId, status: "ACTIVE" }).exec();

  if (activeProductCount > 0) {
    throw new AppError(
      409,
      "CATEGORY_HAS_ACTIVE_PRODUCTS",
      "Category has active products. Move or deactivate those products before deactivating this category."
    );
  }
};

export const listPublicCategories = async (): Promise<CategoryResponse[]> => {
  const categories = await CategoryModel.find({ status: "ACTIVE" }).select(categorySelect).sort({ createdAt: -1 }).lean<CategoryRecord[]>().exec();
  return categories.map(toCategoryResponse);
};

export const listAdminCategories = async (query: CategoryListQuery): Promise<CategoryResponse[]> => {
  const filter: FilterQuery<Category> = query.status ? { status: query.status } : {};
  const categories = await CategoryModel.find(filter).select(categorySelect).sort({ createdAt: -1 }).lean<CategoryRecord[]>().exec();
  return categories.map(toCategoryResponse);
};

export const createCategory = async (input: CategoryInput): Promise<CategoryResponse> => {
  try {
    const category = await CategoryModel.create(input);
    return toCategoryResponse(category.toObject() as CategoryRecord);
  } catch (error) {
    return mapCategoryWriteError(error);
  }
};

export const updateCategory = async (id: string, input: CategoryUpdateInput): Promise<CategoryResponse> => {
  if (input.status === "INACTIVE") {
    await assertCategoryCanBecomeInactive(id);
  }

  try {
    const category = await CategoryModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true })
      .select(categorySelect)
      .lean<CategoryRecord>()
      .exec();

    if (!category) {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    return toCategoryResponse(category);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    return mapCategoryWriteError(error);
  }
};

export const deactivateCategory = async (id: string): Promise<CategoryResponse> => {
  await assertCategoryCanBecomeInactive(id);

  const category = await CategoryModel.findByIdAndUpdate(id, { $set: { status: "INACTIVE" } }, { new: true, runValidators: true })
    .select(categorySelect)
    .lean<CategoryRecord>()
    .exec();

  if (!category) {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }

  return toCategoryResponse(category);
};

export const listPublicProducts = async (query: ProductListQuery): Promise<PaginatedProducts> => {
  const filter = await buildProductListFilter(query, true);
  const skip = (query.page - 1) * query.limit;
  const [products, totalItems] = await Promise.all([
    ProductModel.find(filter).select(productSelect).sort(getProductSort(query.sort)).skip(skip).limit(query.limit).lean<ProductRecord[]>().exec(),
    ProductModel.countDocuments(filter).exec()
  ]);

  return {
    products: products.map(toProductResponse),
    meta: getPaginationMeta(query, totalItems)
  };
};

export const getPublicProductBySlug = async (slug: string): Promise<ProductResponse> => {
  const product = await ProductModel.findOne({ slug, status: "ACTIVE" }).select(productSelect).lean<ProductRecord>().exec();

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const category = await CategoryModel.findOne({ _id: product.categoryId, status: "ACTIVE" }).select("_id").lean<CategoryRecord>().exec();

  if (!category) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return toProductResponse(product);
};

export const listAdminProducts = async (query: ProductListQuery): Promise<PaginatedProducts> => {
  const filter = await buildProductListFilter(query, false);
  const skip = (query.page - 1) * query.limit;
  const [products, totalItems] = await Promise.all([
    ProductModel.find(filter).select(productSelect).sort(getProductSort(query.sort)).skip(skip).limit(query.limit).lean<ProductRecord[]>().exec(),
    ProductModel.countDocuments(filter).exec()
  ]);

  return {
    products: products.map(toProductResponse),
    meta: getPaginationMeta(query, totalItems)
  };
};

export const getAdminProductById = async (id: string): Promise<ProductResponse> => {
  const product = await ProductModel.findById(id).select(productSelect).lean<ProductRecord>().exec();

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return toProductResponse(product);
};

export const createProduct = async (input: ProductInput): Promise<ProductResponse> => {
  await assertCategoryUsableForProduct(input.categoryId, input.status ?? "ACTIVE");

  try {
    const product = await ProductModel.create(input);
    return toProductResponse(product.toObject() as ProductRecord);
  } catch (error) {
    return mapProductWriteError(error);
  }
};

export const updateProduct = async (id: string, input: ProductUpdateInput): Promise<ProductResponse> => {
  const current = await ProductModel.findById(id).select(productSelect).lean<ProductRecord>().exec();

  if (!current) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  const nextCategoryId = input.categoryId ?? current.categoryId.toString();
  const nextStatus = input.status ?? current.status;
  await assertCategoryUsableForProduct(nextCategoryId, nextStatus);

  try {
    const product = await ProductModel.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true })
      .select(productSelect)
      .lean<ProductRecord>()
      .exec();

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
    }

    return toProductResponse(product);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    return mapProductWriteError(error);
  }
};

export const updateProductStock = async (id: string, input: ProductStockUpdateInput): Promise<ProductResponse> => {
  const product = await ProductModel.findByIdAndUpdate(
    id,
    { $set: { stockQuantity: input.stockQuantity } },
    { new: true, runValidators: true }
  )
    .select(productSelect)
    .lean<ProductRecord>()
    .exec();

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return toProductResponse(product);
};

export const updateProductStatus = async (id: string, input: ProductStatusUpdateInput): Promise<ProductResponse> => {
  const current = await ProductModel.findById(id).select(productSelect).lean<ProductRecord>().exec();

  if (!current) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  await assertCategoryUsableForProduct(current.categoryId.toString(), input.status);

  const product = await ProductModel.findByIdAndUpdate(id, { $set: { status: input.status } }, { new: true, runValidators: true })
    .select(productSelect)
    .lean<ProductRecord>()
    .exec();

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return toProductResponse(product);
};

export const deactivateProduct = async (id: string): Promise<ProductResponse> => {
  const product = await ProductModel.findByIdAndUpdate(id, { $set: { status: "INACTIVE" } }, { new: true, runValidators: true })
    .select(productSelect)
    .lean<ProductRecord>()
    .exec();

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  return toProductResponse(product);
};
