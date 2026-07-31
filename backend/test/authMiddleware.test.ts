import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { errorHandler } from "../src/common/middleware/errorHandler.js";
import { authenticate } from "../src/common/middleware/authenticate.js";
import { requireRoles } from "../src/common/middleware/requireRoles.js";
import { getConfig } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";

const createMiddlewareTestApp = () => {
  const app = express();
  app.use((req, _res, next) => {
    req.requestId = "middleware-test";
    next();
  });
  app.get("/admin-test", authenticate, requireRoles("ADMIN"), (_req, res) => {
    res.status(200).json({ success: true });
  });
  app.use(errorHandler(getConfig()));
  return app;
};

describe("auth middleware", () => {
  it("blocks customers from admin-only routes", async () => {
    const app = createMiddlewareTestApp();
    const token = signAccessToken(getConfig(), { sub: "customer-id", role: "CUSTOMER" });

    const response = await request(app).get("/admin-test").set("Authorization", `Bearer ${token}`).expect(403);
    expect(response.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("allows admins through admin-only routes", async () => {
    const app = createMiddlewareTestApp();
    const token = signAccessToken(getConfig(), { sub: "admin-id", role: "ADMIN" });

    const response = await request(app).get("/admin-test").set("Authorization", `Bearer ${token}`).expect(200);
    expect(response.body.success).toBe(true);
  });
});
