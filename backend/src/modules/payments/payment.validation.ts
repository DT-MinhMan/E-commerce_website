import { Types } from "mongoose";
import { AppError } from "../../common/errors/AppError.js";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assertKnownFields = (body: Record<string, unknown>, allowedFields: readonly string[]): void => {
  const allowed = new Set(allowedFields);
  const unknownField = Object.keys(body).find((field) => !allowed.has(field));

  if (unknownField) {
    throw new AppError(400, "VALIDATION_ERROR", `${unknownField} is not allowed`);
  }
};

export const parseCheckoutSessionInput = (body: unknown): { orderId: string } => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  assertKnownFields(body, ["orderId"]);

  if (typeof body.orderId !== "string" || !Types.ObjectId.isValid(body.orderId)) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return { orderId: body.orderId };
};

export const parseOrderIdParam = (value: string | string[] | undefined): string => {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return value;
};
