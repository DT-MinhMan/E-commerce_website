import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("foundation API", () => {
  it("returns health status", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.database).toBeDefined();
    expect(response.body.data.environment).toBe("test");
    expect(response.body.data.timestamp).toBeDefined();
    expect(response.body.meta).toBeNull();
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
});
