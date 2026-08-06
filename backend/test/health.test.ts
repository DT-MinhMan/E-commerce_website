import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app, createApp } from "../src/app.js";
import { getConfig } from "../src/config/env.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("foundation API", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.database).toBeUndefined();
    expect(response.body.data.environment).toBe("test");
    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.meta).toBeNull();
  });

  it("returns readiness status without exposing configuration secrets", async () => {
    const response = await request(app).get("/api/v1/ready").expect(503);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("not_ready");
    expect(response.body.data.database).toBe("disconnected");
    expect(response.body.data.dependencies).toEqual({
      mongodb: "unavailable",
      stripeConfig: "configured"
    });
    expect(JSON.stringify(response.body)).not.toContain("mongodb://");
    expect(JSON.stringify(response.body)).not.toContain("sk_test");
  });

  it("returns standard 404 errors for unknown routes", async () => {
    const response = await request(app).get("/api/v1/unknown").expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe("ROUTE_NOT_FOUND");
    expect(response.body.error.details).toBeNull();
    expect(response.body.requestId).toBeDefined();
  });

  it("uses x-request-id in error responses", async () => {
    const requestId = "phase-1-test-request";
    const response = await request(app).get("/api/v1/missing").set("x-request-id", requestId).expect(404);

    expect(response.body.requestId).toBe(requestId);
    expect(response.headers["x-request-id"]).toBe(requestId);
  });

  it("replaces invalid x-request-id values", async () => {
    const response = await request(app).get("/api/v1/missing").set("x-request-id", "bad id with spaces").expect(404);

    expect(response.body.requestId).toBeDefined();
    expect(response.body.requestId).not.toBe("bad id with spaces");
    expect(response.headers["x-request-id"]).toBe(response.body.requestId);
  });

  it("writes structured request logs when logging is enabled", async () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const loggingApp = createApp({ ...getConfig(), logLevel: "info" });

    await request(loggingApp).get("/api/v1/health").set("x-request-id", "phase-12-log-test").expect(200);

    const logEntry = infoSpy.mock.calls.map(([entry]) => String(entry)).find((entry) => entry.includes("Request completed"));
    expect(logEntry).toBeDefined();

    const parsed = JSON.parse(logEntry as string) as Record<string, unknown>;
    expect(parsed).toMatchObject({
      level: "info",
      message: "Request completed",
      requestId: "phase-12-log-test",
      method: "GET",
      path: "/api/v1/health",
      statusCode: 200
    });
    expect(parsed.timestamp).toEqual(expect.any(String));
    expect(parsed.durationMs).toEqual(expect.any(Number));
    expect(logEntry).not.toContain("authorization");
    expect(logEntry).not.toContain("cookie");
  });
});
