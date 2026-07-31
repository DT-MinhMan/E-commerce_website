import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { CookieOptions } from "express";
import type { Types } from "mongoose";
import type { AppConfig } from "../../config/env.js";
import type { UserRole } from "../../database/enums.js";

export const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
}

export const signAccessToken = (config: AppConfig, payload: AccessTokenPayload): string => {
  const options: SignOptions = { expiresIn: config.jwtAccessExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, config.jwtAccessSecret, options);
};

export const verifyAccessToken = (config: AppConfig, token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, config.jwtAccessSecret);

  if (
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    (payload.role !== "CUSTOMER" && payload.role !== "ADMIN")
  ) {
    throw new Error("Invalid access token payload");
  }

  return {
    sub: payload.sub,
    role: payload.role
  };
};

export const generateRefreshToken = (): string => crypto.randomBytes(48).toString("base64url");

export const hashRefreshToken = (token: string): string => crypto.createHash("sha256").update(token).digest("hex");

export const getRefreshTokenExpiresAt = (config: AppConfig): Date =>
  new Date(Date.now() + config.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);

export const getRefreshCookieOptions = (config: AppConfig, expiresAt?: Date): CookieOptions => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  path: "/api/v1/auth",
  expires: expiresAt
});

export const toUserId = (userId: Types.ObjectId): string => userId.toString();
