import { Types } from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import { CATEGORY_STATUSES, PRODUCT_STATUSES, ROOM_TYPES, type ProductStatus, type RoomType } from "../../database/enums.js";
import { isCurrencyCode, isNonNegativeInteger, isSlug } from "../../database/validators.js";
import type {
  CategoryInput,
  CategoryListQuery,
  CategoryUpdateInput,
  ProductImageInput,
  ProductInput,
  ProductListQuery,
  ProductStatusUpdateInput,
  ProductStockUpdateInput,
  ProductUpdateInput
} from "./catalog.types.js";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;
const PRODUCT_SORTS = ["newest", "price_asc", "price_desc"] as const;
const PRODUCT_STOCK_STATES = ["in_stock", "low_stock", "out_of_stock"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertKnownFields = (body: Record<string, unknown>, allowedFields: readonly string[]): void => {
  const allowed = new Set(allowedFields);
  const unknownField = Object.keys(body).find((field) => !allowed.has(field));

  if (unknownField) {
    throw new AppError(400, "VALIDATION_ERROR", `${unknownField} is not allowed`);
  }
};

const requiredString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} is required`);
  }

  return value.trim();
};

const optionalString = (body: Record<string, unknown>, field: string): string | undefined => {
  const value = body[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a string`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const requiredInteger = (body: Record<string, unknown>, field: string): number => {
  const value = body[field];

  if (typeof value !== "number" || !isNonNegativeInteger(value)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a non-negative integer`);
  }

  return value;
};

const optionalInteger = (body: Record<string, unknown>, field: string): number | undefined => {
  const value = body[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !isNonNegativeInteger(value)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a non-negative integer`);
  }

  return value;
};

const normalizeSlug = (slug: string): string => slug.trim().toLowerCase();

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const parseSlug = (body: Record<string, unknown>, field: string, fallbackName?: string): string | undefined => {
  const rawSlug = optionalString(body, field);
  const slug = rawSlug ? normalizeSlug(rawSlug) : fallbackName ? slugify(fallbackName) : undefined;

  if (slug !== undefined && !isSlug(slug)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a valid slug`);
  }

  return slug;
};

const parseStatus = <TStatus extends string>(
  body: Record<string, unknown>,
  field: string,
  statuses: readonly TStatus[]
): TStatus | undefined => {
  const value = body[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !statuses.includes(value as TStatus)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be one of: ${statuses.join(", ")}`);
  }

  return value as TStatus;
};

const assertStringLength = (value: string, field: string, min: number, max: number): void => {
  if (value.length < min || value.length > max) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be between ${min} and ${max} characters`);
  }
};

const assertOptionalStringLength = (value: string | undefined, field: string, max: number): void => {
  if (value !== undefined && value.length > max) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be at most ${max} characters`);
  }
};

const assertObjectId = (value: string, field: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a valid ObjectId`);
  }
};

const parseObjectIdString = (body: Record<string, unknown>, field: string): string => {
  const value = requiredString(body, field);
  assertObjectId(value, field);
  return value;
};

const parseOptionalObjectIdString = (body: Record<string, unknown>, field: string): string | undefined => {
  const value = optionalString(body, field);

  if (value !== undefined) {
    assertObjectId(value, field);
  }

  return value;
};

const assertHttpUrl = (value: string, field: string): void => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
  } catch {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a valid http or https URL`);
  }
};

const parseImages = (body: Record<string, unknown>): ProductImageInput[] | undefined => {
  const value = body.images;

  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length > 8) {
    throw new AppError(400, "VALIDATION_ERROR", "images must be an array with at most 8 items");
  }

  return value.map((image, index) => {
    if (!isRecord(image)) {
      throw new AppError(400, "VALIDATION_ERROR", `images.${index} must be an object`);
    }

    assertKnownFields(image, ["url", "alt", "publicId"]);
    const url = requiredString(image, "url");
    const alt = optionalString(image, "alt");
    const publicId = optionalString(image, "publicId");
    assertHttpUrl(url, `images.${index}.url`);
    assertOptionalStringLength(alt, `images.${index}.alt`, 160);
    assertOptionalStringLength(publicId, `images.${index}.publicId`, 255);

    return { url, ...(alt === undefined ? {} : { alt }), ...(publicId === undefined ? {} : { publicId }) };
  });
};

const parseCurrency = (body: Record<string, unknown>): string | undefined => {
  const currency = optionalString(body, "currency")?.toUpperCase();

  if (currency !== undefined && !isCurrencyCode(currency)) {
    throw new AppError(400, "VALIDATION_ERROR", "currency must be an ISO-style code");
  }

  return currency;
};

const parseBody = (body: unknown, allowedFields: readonly string[]): Record<string, unknown> => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  assertKnownFields(body, allowedFields);
  return body;
};

const assertHasUpdate = (input: object): void => {
  if (Object.keys(input).length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", "At least one field is required");
  }
};

const queryString = (query: Record<string, unknown>, field: string): string | undefined => {
  const value = query[field];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a string`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseQueryInteger = (
  query: Record<string, unknown>,
  field: string,
  defaultValue?: number,
  maxValue?: number
): number | undefined => {
  const value = queryString(query, field);

  if (value === undefined) {
    return defaultValue;
  }

  if (!/^\d+$/.test(value)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a non-negative integer`);
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || (maxValue !== undefined && parsed > maxValue)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} is out of range`);
  }

  return parsed;
};

export const parseObjectIdParam = (value: string | undefined, field = "id"): string => {
  if (!value || !Types.ObjectId.isValid(value)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a valid ObjectId`);
  }

  return value;
};

export const parseSlugParam = (value: string | undefined): string => {
  const slug = value ? normalizeSlug(value) : "";

  if (!isSlug(slug)) {
    throw new AppError(400, "VALIDATION_ERROR", "slug must be a valid slug");
  }

  return slug;
};

export const parseCategoryCreateInput = (body: unknown): CategoryInput => {
  const parsed = parseBody(body, ["name", "slug", "description", "imageUrl", "status"]);
  const name = requiredString(parsed, "name");
  const description = optionalString(parsed, "description");
  const imageUrl = optionalString(parsed, "imageUrl");
  const status = parseStatus(parsed, "status", CATEGORY_STATUSES);
  const slug = parseSlug(parsed, "slug", name);

  assertStringLength(name, "name", 2, 120);
  assertOptionalStringLength(description, "description", 500);

  if (imageUrl !== undefined) {
    assertHttpUrl(imageUrl, "imageUrl");
  }

  return { name, slug, description, imageUrl, status };
};

export const parseCategoryUpdateInput = (body: unknown): CategoryUpdateInput => {
  const parsed = parseBody(body, ["name", "slug", "description", "imageUrl", "status"]);
  const name = optionalString(parsed, "name");
  const description = optionalString(parsed, "description");
  const imageUrl = optionalString(parsed, "imageUrl");
  const status = parseStatus(parsed, "status", CATEGORY_STATUSES);
  const slug = parseSlug(parsed, "slug");
  const input: CategoryUpdateInput = {};

  if (name !== undefined) {
    assertStringLength(name, "name", 2, 120);
    input.name = name;
  }

  if (slug !== undefined) {
    input.slug = slug;
  }

  if (description !== undefined) {
    assertOptionalStringLength(description, "description", 500);
    input.description = description;
  }

  if (imageUrl !== undefined) {
    assertHttpUrl(imageUrl, "imageUrl");
    input.imageUrl = imageUrl;
  }

  if (status !== undefined) {
    input.status = status;
  }

  assertHasUpdate(input);
  return input;
};

export const parseCategoryListQuery = (query: unknown): CategoryListQuery => {
  const parsed = isRecord(query) ? query : {};
  const status = parseStatus(parsed, "status", CATEGORY_STATUSES);
  return status === undefined ? {} : { status };
};

export const parseProductCreateInput = (body: unknown): ProductInput => {
  const parsed = parseBody(body, [
    "name",
    "slug",
    "description",
    "categoryId",
    "roomType",
    "priceMinor",
    "currency",
    "stockQuantity",
    "images",
    "status"
  ]);
  const name = requiredString(parsed, "name");
  const description = requiredString(parsed, "description");
  const categoryId = parseObjectIdString(parsed, "categoryId");
  const roomType = parseStatus<RoomType>(parsed, "roomType", ROOM_TYPES);
  const priceMinor = requiredInteger(parsed, "priceMinor");
  const stockQuantity = requiredInteger(parsed, "stockQuantity");
  const currency = parseCurrency(parsed);
  const images = parseImages(parsed);
  const status = parseStatus<ProductStatus>(parsed, "status", PRODUCT_STATUSES);
  const slug = parseSlug(parsed, "slug", name);

  assertStringLength(name, "name", 2, 180);
  assertStringLength(description, "description", 10, 3000);

  return { name, slug, description, categoryId, roomType, priceMinor, currency, stockQuantity, images, status };
};

export const parseProductUpdateInput = (body: unknown): ProductUpdateInput => {
  const parsed = parseBody(body, [
    "name",
    "slug",
    "description",
    "categoryId",
    "roomType",
    "priceMinor",
    "currency",
    "stockQuantity",
    "images",
    "status"
  ]);
  const input: ProductUpdateInput = {};
  const name = optionalString(parsed, "name");
  const slug = parseSlug(parsed, "slug");
  const description = optionalString(parsed, "description");
  const categoryId = parseOptionalObjectIdString(parsed, "categoryId");
  const roomType = parseStatus<RoomType>(parsed, "roomType", ROOM_TYPES);
  const priceMinor = optionalInteger(parsed, "priceMinor");
  const currency = parseCurrency(parsed);
  const stockQuantity = optionalInteger(parsed, "stockQuantity");
  const images = parseImages(parsed);
  const status = parseStatus<ProductStatus>(parsed, "status", PRODUCT_STATUSES);

  if (name !== undefined) {
    assertStringLength(name, "name", 2, 180);
    input.name = name;
  }

  if (slug !== undefined) {
    input.slug = slug;
  }

  if (description !== undefined) {
    assertStringLength(description, "description", 10, 3000);
    input.description = description;
  }

  if (categoryId !== undefined) {
    input.categoryId = categoryId;
  }

  if (roomType !== undefined) {
    input.roomType = roomType;
  }

  if (priceMinor !== undefined) {
    input.priceMinor = priceMinor;
  }

  if (currency !== undefined) {
    input.currency = currency;
  }

  if (stockQuantity !== undefined) {
    input.stockQuantity = stockQuantity;
  }

  if (images !== undefined) {
    input.images = images;
  }

  if (status !== undefined) {
    input.status = status;
  }

  assertHasUpdate(input);
  return input;
};

export const parseProductStockUpdateInput = (body: unknown): ProductStockUpdateInput => {
  const parsed = parseBody(body, ["stockQuantity"]);
  return { stockQuantity: requiredInteger(parsed, "stockQuantity") };
};

export const parseProductStatusUpdateInput = (body: unknown): ProductStatusUpdateInput => {
  const parsed = parseBody(body, ["status"]);
  const status = parseStatus<ProductStatus>(parsed, "status", PRODUCT_STATUSES);

  if (status === undefined) {
    throw new AppError(400, "VALIDATION_ERROR", "status is required");
  }

  return { status };
};

export const parseProductListQuery = (query: unknown, includeStatus = false): ProductListQuery => {
  const parsed = isRecord(query) ? query : {};
  const page = parseQueryInteger(parsed, "page", 1);
  const limit = parseQueryInteger(parsed, "limit", DEFAULT_LIMIT, MAX_LIMIT);
  const minPriceMinor = parseQueryInteger(parsed, "minPriceMinor");
  const maxPriceMinor = parseQueryInteger(parsed, "maxPriceMinor");
  const sort = queryString(parsed, "sort") ?? "newest";
  const category = queryString(parsed, "category");
  const roomType = parseStatus<RoomType>(parsed, "roomType", ROOM_TYPES);
  const q = queryString(parsed, "q");
  const status = includeStatus ? parseStatus<ProductStatus>(parsed, "status", PRODUCT_STATUSES) : undefined;
  const stockState = queryString(parsed, "stockState");

  if (page === undefined || page < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "page must be at least 1");
  }

  if (limit === undefined || limit < 1) {
    throw new AppError(400, "VALIDATION_ERROR", "limit must be at least 1");
  }

  if (!PRODUCT_SORTS.includes(sort as ProductListQuery["sort"])) {
    throw new AppError(400, "VALIDATION_ERROR", "sort must be one of: newest, price_asc, price_desc");
  }

  if (category !== undefined && !isSlug(normalizeSlug(category))) {
    throw new AppError(400, "VALIDATION_ERROR", "category must be a valid slug");
  }

  if (minPriceMinor !== undefined && maxPriceMinor !== undefined && minPriceMinor > maxPriceMinor) {
    throw new AppError(400, "VALIDATION_ERROR", "minPriceMinor cannot be greater than maxPriceMinor");
  }

  if (stockState !== undefined && !PRODUCT_STOCK_STATES.includes(stockState as (typeof PRODUCT_STOCK_STATES)[number])) {
    throw new AppError(400, "VALIDATION_ERROR", "stockState must be one of: in_stock, low_stock, out_of_stock");
  }

  return {
    page,
    limit,
    minPriceMinor,
    maxPriceMinor,
    sort: sort as ProductListQuery["sort"],
    category: category === undefined ? undefined : normalizeSlug(category),
    roomType,
    q,
    status,
    stockState: stockState as ProductListQuery["stockState"] | undefined
  };
};
