import { AppError } from "../../common/errors/AppError.js";
import type {
  ForgotPasswordInput,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  ResendOtpInput,
  ResetPasswordInput,
  VerifyEmailInput
} from "./auth.types.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_PATTERN = /^\d{6}$/;

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

export const parseVerifyEmailInput = (body: unknown): VerifyEmailInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const email = requiredString(body, "email").toLowerCase();
  const code = requiredString(body, "code");

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, "VALIDATION_ERROR", "Email must be valid");
  }

  if (!OTP_PATTERN.test(code)) {
    throw new AppError(400, "VALIDATION_ERROR", "Verification code must be 6 digits");
  }

  return { email, code };
};

export const parseResendOtpInput = (body: unknown): ResendOtpInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const email = requiredString(body, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, "VALIDATION_ERROR", "Email must be valid");
  }

  return { email };
};

export const parseGoogleLoginInput = (body: unknown): GoogleLoginInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const idToken = requiredString(body, "idToken");

  return { idToken };
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

export const parseForgotPasswordInput = (body: unknown): ForgotPasswordInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const email = requiredString(body, "email").toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, "VALIDATION_ERROR", "Email must be valid");
  }

  return { email };
};

export const parseResetPasswordInput = (body: unknown): ResetPasswordInput => {
  if (!isRecord(body)) {
    throw new AppError(400, "VALIDATION_ERROR", "Request body must be an object");
  }

  const email = requiredString(body, "email").toLowerCase();
  const code = requiredString(body, "code");
  const newPassword = requiredString(body, "newPassword");

  if (!EMAIL_PATTERN.test(email)) {
    throw new AppError(400, "VALIDATION_ERROR", "Email must be valid");
  }

  if (!OTP_PATTERN.test(code)) {
    throw new AppError(400, "VALIDATION_ERROR", "Verification code must be 6 digits");
  }

  assertPassword(newPassword);

  return { email, code, newPassword };
};
