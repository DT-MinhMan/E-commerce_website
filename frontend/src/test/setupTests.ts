import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { useAuthStore } from "../features/auth/store/authStore.js";

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    status: "idle",
    error: null
  });
});
