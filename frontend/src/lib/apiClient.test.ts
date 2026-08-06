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
});
