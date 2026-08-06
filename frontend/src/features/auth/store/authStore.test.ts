import { describe, expect, it, vi } from "vitest";
import { apiClient } from "../../../lib/apiClient.js";
import { useAuthStore } from "./authStore.js";
import type { AuthSession } from "../types.js";

const customerSession: AuthSession = {
  accessToken: "access-token",
  user: {
    id: "user-1",
    email: "customer@example.com",
    fullName: "Customer",
    role: "CUSTOMER",
    status: "ACTIVE"
  }
};

describe("authStore", () => {
  it("keeps access tokens in memory and not browser storage", async () => {
    const adapter = vi.fn(async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config
    }));
    const previousAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = adapter;

    try {
      useAuthStore.getState().setSession(customerSession);

      expect(useAuthStore.getState()).toMatchObject({
        accessToken: "access-token",
        user: customerSession.user,
        status: "authenticated",
        error: null
      });
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(sessionStorage.getItem("accessToken")).toBeNull();
      expect(sessionStorage.getItem("refreshToken")).toBeNull();

      await apiClient.get("/test-auth-header");
      expect(adapter.mock.calls[0]?.[0].headers.Authorization).toBe("Bearer access-token");

      useAuthStore.getState().clearSession();
      await apiClient.get("/test-auth-header-after-clear");
      expect(adapter.mock.calls[1]?.[0].headers.Authorization).toBeUndefined();
    } finally {
      apiClient.defaults.adapter = previousAdapter;
    }
  });

  it("stores only user/session UI state in Zustand", () => {
    useAuthStore.getState().setSession(customerSession);
    useAuthStore.getState().setError("Expired");

    expect(useAuthStore.getState().user?.email).toBe("customer@example.com");
    expect(useAuthStore.getState()).not.toHaveProperty("cart");
    expect(useAuthStore.getState()).not.toHaveProperty("orders");
    expect(useAuthStore.getState()).not.toHaveProperty("products");
    expect(useAuthStore.getState().error).toBe("Expired");
  });
});
