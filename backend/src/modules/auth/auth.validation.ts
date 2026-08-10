import { AppError } from "../../common/errors/AppError.js";
import type { LoginInput, RegisterInput } from "./auth.types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError(400, "VALIDATION_ERROR", `${field} is required`);
  }

  return value.trim();
};

const assertPassword = (password: string): void => {
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError(400, "VALIDATION_ERROR", "Password must be at least 8 characters and include letters and numbers");
  }
};

export const parseRegisterInput = (body: unknown): RegisterInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const email = requiredString(body, "email").toLowerCase();
  const password = requiredString(body, "password");
  const fullName = requiredString(body, "fullName");

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, "VALIDATION_ERROR", "Email must be valid");
  }

  if (fullName.length < 2 || fullName.length > 120) {
    throw new AppError(400, "VALIDATION_ERROR", "Full name must be between 2 and 120 characters");
  }

  assertPassword(password);

  return { email, password, fullName };
};

export const parseLoginInput = (body: unknown): LoginInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  return {
    email: requiredString(body, "email").toLowerCase(),
    password: requiredString(body, "password")
  };
};

export const parseChangePasswordInput = (body: unknown): { currentPassword: string; newPassword: string } => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const currentPassword = requiredString(body, "currentPassword");
  const newPassword = requiredString(body, "newPassword");

  assertPassword(newPassword);

  return { currentPassword, newPassword };
};
