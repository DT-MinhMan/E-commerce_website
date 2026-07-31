import { Types } from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import type { CartItemInput, CartQuantityInput } from "./cart.types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertKnownFields = (body: Record<string, unknown>, allowedFields: readonly string[]): void => {
  const allowed = new Set(allowedFields);
  const unknownField = Object.keys(body).find((field) => !allowed.has(field));

  if (unknownField) {
    throw new AppError(400, "VALIDATION_ERROR", `${unknownField} is not allowed`);
  }
};

const parseBody = (body: unknown, allowedFields: readonly string[]): Record<string, unknown> => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  assertKnownFields(body, allowedFields);
  return body;
};

export const parseObjectIdParam = (value: string | string[] | undefined, field = "productId"): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be a valid ObjectId`);
  }

  return value;
};

const parseQuantity = (body: Record<string, unknown>): number => {
  const value = body.quantity;

  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new AppError(400, "CART_INVALID_QUANTITY", "quantity must be a positive integer");
  }

  return value;
};

export const parseAddCartItemInput = (body: unknown): CartItemInput => {
  const parsed = parseBody(body, ["productId", "quantity"]);
  const productId = parsed.productId;

  if (typeof productId !== "string" || !Types.ObjectId.isValid(productId)) {
    throw new AppError(400, "VALIDATION_ERROR", "productId must be a valid ObjectId");
  }

  return {
    productId,
    quantity: parseQuantity(parsed)
  };
};

export const parseCartQuantityInput = (body: unknown): CartQuantityInput => {
  const parsed = parseBody(body, ["quantity"]);
  return {
    quantity: parseQuantity(parsed)
  };
};
