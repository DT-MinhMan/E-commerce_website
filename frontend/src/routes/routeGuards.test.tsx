import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/testUtils.js";
import { useAuthStore } from "../features/auth/store/authStore.js";
import { AdminRoute } from "./AdminRoute.js";
import { ProtectedRoute } from "./ProtectedRoute.js";
import { LoginPage } from "../pages/account/LoginPage.js";

const setUser = (role: "CUSTOMER" | "ADMIN") => {
  useAuthStore.getState().setSession({
    accessToken: `${role.toLowerCase()}-token`,
    user: {
      id: `${role.toLowerCase()}-1`,
      email: `${role.toLowerCase()}@example.com`,
      fullName: role,
      role,
      status: "ACTIVE"
    }
  });
};

describe("route guards", () => {
  it("shows loading while auth bootstrap is unresolved", () => {
    useAuthStore.getState().setStatus("loading");

    renderWithProviders(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<div>Account page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects unauthenticated users and allows authenticated customers", () => {
    useAuthStore.getState().clearSession();

    renderWithProviders(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<div>Account page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Login page")).toBeInTheDocument();

    setUser("CUSTOMER");
    renderWithProviders(
      <MemoryRouter initialEntries={["/account"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<div>Account page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Account page")).toBeInTheDocument();
  });

  it("keeps admin routes admin-only", () => {
    setUser("CUSTOMER");

    renderWithProviders(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/account" element={<div>Account page</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Account page")).toBeInTheDocument();

    setUser("ADMIN");
    renderWithProviders(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/account" element={<div>Account page</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<div>Admin page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Admin page")).toBeInTheDocument();
  });

  it("redirects authenticated users from login by role", () => {
    setUser("ADMIN");

    renderWithProviders(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Admin page</div>} />
          <Route path="/account" element={<div>Account page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Admin page")).toBeInTheDocument();

    setUser("CUSTOMER");
    renderWithProviders(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<div>Admin page</div>} />
          <Route path="/account" element={<div>Account page</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("Account page")).toBeInTheDocument();
  });

  it("returns admins to the requested admin route after login", () => {
    setUser("ADMIN");

    renderWithProviders(
      <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: { pathname: "/admin/orders" } } }]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/orders" element={<div>Admin orders page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin orders page")).toBeInTheDocument();
  });
});
