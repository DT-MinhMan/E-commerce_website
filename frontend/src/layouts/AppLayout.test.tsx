import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../test/testUtils.js";
import { useAuthStore } from "../features/auth/store/authStore.js";
import { AppLayout } from "./AppLayout.js";

const logoutMutate = vi.fn();

vi.mock("../features/auth/hooks/useAuthQueries.js", async () => {
  const actual = await vi.importActual<typeof import("../features/auth/hooks/useAuthQueries.js")>("../features/auth/hooks/useAuthQueries.js");

  return {
    ...actual,
    useLogout: () => ({ mutate: logoutMutate })
  };
});

vi.mock("../features/catalog/hooks/useCatalogQueries.js", async () => {
  const actual = await vi.importActual<typeof import("../features/catalog/hooks/useCatalogQueries.js")>("../features/catalog/hooks/useCatalogQueries.js");

  return {
    ...actual,
    useCategoriesQuery: () => ({ data: [] })
  };
});

vi.mock("../features/cart/hooks/useCartQueries.js", async () => {
  const actual = await vi.importActual<typeof import("../features/cart/hooks/useCartQueries.js")>("../features/cart/hooks/useCartQueries.js");

  return {
    ...actual,
    useCartQuery: () => ({ data: { itemCount: 3 } })
  };
});

const setUser = (role: "CUSTOMER" | "ADMIN") => {
  useAuthStore.getState().setSession({
    accessToken: `${role.toLowerCase()}-token`,
    user: {
      id: `${role.toLowerCase()}-1`,
      email: `${role.toLowerCase()}@example.com`,
      fullName: role === "ADMIN" ? "Demo Admin" : "Demo Customer",
      role,
      status: "ACTIVE"
    }
  });
};

const renderLayout = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={["/admin"]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/admin" element={<div>Page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe("AppLayout header selection", () => {
  beforeEach(() => {
    logoutMutate.mockClear();
    useAuthStore.getState().clearSession();
  });

  it("uses the admin header for admin users", () => {
    setUser("ADMIN");

    renderLayout();

    expect(screen.getByRole("link", { name: "ZenLiving admin dashboard" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Products" })).toHaveAttribute("href", "/admin/products");
    expect(screen.getByRole("link", { name: "Orders" })).toHaveAttribute("href", "/admin/orders");
    expect(screen.getByRole("link", { name: "Storefront" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Demo Admin")).toBeInTheDocument();
    expect(screen.queryByText("3")).not.toBeInTheDocument();
  });

  it("keeps the storefront header for customers and guests", () => {
    setUser("CUSTOMER");

    const { unmount } = renderLayout();

    expect(screen.getByRole("link", { name: /ZenLiving/ })).toHaveAttribute("href", "/");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ZenLiving admin dashboard" })).not.toBeInTheDocument();

    unmount();
    useAuthStore.getState().clearSession();
    renderLayout();

    expect(screen.getByRole("link", { name: /ZenLiving/ })).toHaveAttribute("href", "/");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "ZenLiving admin dashboard" })).not.toBeInTheDocument();
  });

  it("logs out from the admin header", async () => {
    setUser("ADMIN");

    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(logoutMutate).toHaveBeenCalledTimes(1);
  });
});
