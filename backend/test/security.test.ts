import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { AppError } from "../src/common/errors/AppError.js";
import { errorHandler } from "../src/common/middleware/errorHandler.js";
import { createRateLimiter } from "../src/common/middleware/rateLimits.js";
import { getRefreshCookieOptions } from "../src/modules/auth/tokens.js";
import { app } from "../src/app.js";
import type { AppConfig } from "../src/config/env.js";

const productionConfig: AppConfig = {
  nodeEnv: "production",
  port: 5000,
  mongodbUri: "mongodb://localhost:27017/test",
  clientUrl: "https://shop.example.com",
  logLevel: "silent",
  jwtAccessSecret: "test-access-secret-with-enough-length-for-phase-11",
  jwtAccessExpiresIn: "15m",
  refreshTokenExpiresInDays: 7,
  cookieSecure: true,
  cookieSameSite: "none",
  stripeSecretKey: "sk_test_mock",
  stripeWebhookSecret: "whsec_mock",
  stripeSuccessUrl: "https://shop.example.com/payment/success?orderId={ORDER_ID}",
  stripeCancelUrl: "https://shop.example.com/payment/cancel?orderId={ORDER_ID}",
  cloudinaryProductFolder: "ecommerce/products"
};

describe("security hardening", () => {
  it("returns requestId on errors and does not expose stack traces in production", async () => {
    const testApp = express();
    testApp.use((req, _res, next) => {
      req.requestId = "phase-11-request";
      next();
    });
    testApp.get("/boom", () => {
      throw new Error("database password should not leak");
    });
    testApp.get("/known-error", () => {
      throw new AppError(400, "KNOWN_ERROR", "Known failure");
    });
    testApp.use(errorHandler(productionConfig));

    const unexpected = await request(testApp).get("/boom").expect(500);
    expect(unexpected.body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        details: null
      },
      requestId: "phase-11-request"
    });
    expect(JSON.stringify(unexpected.body)).not.toContain("stack");
    expect(JSON.stringify(unexpected.body)).not.toContain("database password should not leak");

    const known = await request(testApp).get("/known-error").expect(400);
    expect(known.body.requestId).toBe("phase-11-request");
    expect(known.body.error.stack).toBeUndefined();
  });

  it("allows configured CORS origin and omits credential CORS headers for disallowed origins", async () => {
    const allowed = await request(app).get("/api/v1/missing").set("Origin", "http://localhost:5173").expect(404);
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(allowed.headers["access-control-allow-credentials"]).toBe("true");

    const disallowed = await request(app).get("/api/v1/missing").set("Origin", "https://evil.example").expect(404);
    expect(disallowed.headers["access-control-allow-origin"]).toBeUndefined();
    expect(disallowed.headers["access-control-allow-credentials"]).toBeUndefined();
  });

  it("rejects cross-origin refresh/logout requests when Origin is present", async () => {
    const rejectedRefresh = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", "https://evil.example")
      .set("Cookie", "refreshToken=test")
      .expect(403);
    expect(rejectedRefresh.body.error.code).toBe("CSRF_ORIGIN_FORBIDDEN");

    const rejectedLogout = await request(app)
      .post("/api/v1/auth/logout")
      .set("Origin", "https://evil.example")
      .set("Cookie", "refreshToken=test")
      .expect(403);
    expect(rejectedLogout.body.error.code).toBe("CSRF_ORIGIN_FORBIDDEN");
  });

  it("keeps refresh cookie httpOnly and production secure", () => {
    const expires = new Date("2026-08-01T00:00:00.000Z");
    expect(getRefreshCookieOptions(productionConfig, expires)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/api/v1/auth",
      expires
    });
  });

  it("can rate limit sensitive route groups with standard headers", async () => {
    const testApp = express();
    testApp.use(
      createRateLimiter({
        windowMs: 60 * 1000,
        limit: 2,
        message: "Too many test requests"
      })
    );
    testApp.get("/limited", (_req, res) => res.status(200).json({ ok: true }));

    await request(testApp).get("/limited").expect(200);
    const second = await request(testApp).get("/limited").expect(200);
    expect(second.headers["ratelimit-limit"]).toBe("2");

    const limited = await request(testApp).get("/limited").expect(429);
    expect(limited.text).toContain("Too many test requests");
  });
});
