import rateLimit, { type Options } from "express-rate-limit";

type RateLimitOptions = Pick<Options, "windowMs" | "limit" | "message">;

export const createRateLimiter = (options: RateLimitOptions) =>
  rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false
  });

export const globalApiRateLimiter = () =>
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: "Too many requests"
  });

export const authRateLimiter = () =>
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    message: "Too many authentication requests"
  });

export const refreshRateLimiter = () =>
  createRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 80,
    message: "Too many session refresh requests"
  });

export const webhookRateLimiter = () =>
  createRateLimiter({
    windowMs: 60 * 1000,
    limit: 120,
    message: "Too many webhook requests"
  });
