import { Types } from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "../../database/enums.js";
import type { AdminOrderListQuery, AdminOrderStatusUpdateInput, CheckoutInput, OrderListQuery, ShippingAddressInput } from "./order.types.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertKnownFields = (body: Record<string, unknown>, allowedFields: readonly string[], code = "VALIDATION_ERROR"): void => {
  const allowed = new Set(allowedFields);
  const unknownField = Object.keys(body).find((field) => !allowed.has(field));

  if (unknownField) {
    throw new AppError(400, code, `${unknownField} is not allowed`);
  }
};

const parseBody = (body: unknown, allowedFields: readonly string[]): Record<string, unknown> => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  assertKnownFields(body, allowedFields);
  return body;
};

const parseRequiredString = (body: Record<string, unknown>, field: keyof ShippingAddressInput, maxLength: number): string => {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > maxLength) {
    throw new AppError(400, "CHECKOUT_INVALID_ADDRESS", `${field} is required`);
  }

  return value.trim();
};

export const parseCheckoutInput = (body: unknown): CheckoutInput => {
  const parsed = parseBody(body, ["shippingAddress"]);
  const shippingAddress = parsed.shippingAddress;

  if (!isRecord(shippingAddress)) {
    throw new AppError(400, "CHECKOUT_INVALID_ADDRESS", "shippingAddress is required");
  }

  assertKnownFields(
    shippingAddress,
    ["recipientName", "phone", "addressLine1", "addressLine2", "city", "stateOrProvince", "postalCode", "countryCode"],
    "CHECKOUT_INVALID_ADDRESS"
  );

  const countryCode = parseRequiredString(shippingAddress, "countryCode", 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw new AppError(400, "CHECKOUT_INVALID_ADDRESS", "countryCode must be a two-letter country code");
  }

  const addressLine2 = shippingAddress.addressLine2;
  if (addressLine2 !== undefined && (typeof addressLine2 !== "string" || addressLine2.trim().length > 200)) {
    throw new AppError(400, "CHECKOUT_INVALID_ADDRESS", "addressLine2 is invalid");
  }

  return {
    shippingAddress: {
      recipientName: parseRequiredString(shippingAddress, "recipientName", 120),
      phone: parseRequiredString(shippingAddress, "phone", 40),
      addressLine1: parseRequiredString(shippingAddress, "addressLine1", 200),
      addressLine2: typeof addressLine2 === "string" && addressLine2.trim().length > 0 ? addressLine2.trim() : undefined,
      city: parseRequiredString(shippingAddress, "city", 120),
      stateOrProvince: parseRequiredString(shippingAddress, "stateOrProvince", 120),
      postalCode: parseRequiredString(shippingAddress, "postalCode", 32),
      countryCode
    }
  };
};

const parsePositiveInt = (value: unknown, fallback: number, max: number): number => {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
    throw new AppError(400, "VALIDATION_ERROR", `value must be an integer between 1 and ${max}`);
  }

  return parsed;
};

export const parseOrderListQuery = (query: Record<string, unknown>): OrderListQuery => ({
  page: parsePositiveInt(query.page, 1, 1000),
  limit: parsePositiveInt(query.limit, 10, 50)
});

const parseOptionalEnum = <TValue extends string>(value: unknown, allowed: readonly TValue[], field: string): TValue | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string" || !allowed.includes(value as TValue)) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} must be one of: ${allowed.join(", ")}`);
  }

  return value as TValue;
};

const parseRequiredEnum = <TValue extends string>(body: Record<string, unknown>, allowed: readonly TValue[], field: string): TValue => {
  const value = parseOptionalEnum(body[field], allowed, field);

  if (value === undefined) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} is required`);
  }

  return value;
};

export const parseAdminOrderListQuery = (query: Record<string, unknown>): AdminOrderListQuery => {
  const q = typeof query.q === "string" && query.q.trim().length > 0 ? query.q.trim() : undefined;

  if (query.q !== undefined && typeof query.q !== "string") {
    throw new AppError(400, "VALIDATION_ERROR", "q must be a string");
  }

  return {
    page: parsePositiveInt(query.page, 1, 1000),
    limit: parsePositiveInt(query.limit, 10, 50),
    orderStatus: parseOptionalEnum<OrderStatus>(query.orderStatus, ORDER_STATUSES, "orderStatus"),
    paymentStatus: parseOptionalEnum<PaymentStatus>(query.paymentStatus, PAYMENT_STATUSES, "paymentStatus"),
    q
  };
};

export const parseAdminOrderStatusUpdateInput = (body: unknown): AdminOrderStatusUpdateInput => {
  const parsed = parseBody(body, ["nextStatus", "expectedCurrentStatus"]);

  return {
    nextStatus: parseRequiredEnum<OrderStatus>(parsed, ORDER_STATUSES, "nextStatus"),
    expectedCurrentStatus: parseRequiredEnum<OrderStatus>(parsed, ORDER_STATUSES, "expectedCurrentStatus")
  };
};

export const parseOrderIdParam = (value: string | string[] | undefined): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return value;
};
