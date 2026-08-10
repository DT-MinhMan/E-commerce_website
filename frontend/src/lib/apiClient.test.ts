import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vitest";
import { apiClient, setAccessToken } from "./apiClient.js";

describe("apiClient", () => {
  const originalAdapter = apiClient.defaults.adapter;
  let capturedConfig: InternalAxiosRequestConfig | null = null;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    capturedConfig = null;
    setAccessToken(null);
  });

  it("adds a request id and memory-only authorization header", async () => {
    const adapter: AxiosAdapter = async (config) => {
      capturedConfig = config;
      return {
        data: { success: true, data: null, meta: null },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    };
    apiClient.defaults.adapter = adapter;
    setAccessToken("access-token");

    await apiClient.get("/phase-12");

    expect(capturedConfig?.headers?.["x-request-id"]).toEqual(expect.any(String));
    expect(capturedConfig?.headers?.Authorization).toBe("Bearer access-token");
    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(sessionStorage.getItem("accessToken")).toBeNull();
  });

  it("deduplicates concurrent refreshSession requests into a single API call", async () => {
    let callCount = 0;
    const adapter: AxiosAdapter = async (config) => {
      callCount++;
      return {
        data: {
          success: true,
          data: {
            accessToken: "new-access-token",
            user: { id: "1", email: "test@example.com", fullName: "Test", role: "CUSTOMER", status: "ACTIVE" }
          },
          meta: null
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config
      };
    };
    apiClient.defaults.adapter = adapter;

    const { refreshSession } = await import("./apiClient.js");

    const [res1, res2] = await Promise.all([refreshSession(), refreshSession()]);

    expect(callCount).toBe(1);
    expect(res1.accessToken).toBe("new-access-token");
    expect(res2.accessToken).toBe("new-access-token");
  });
});
