import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../../features/auth/types.js";
import { renderWithProviders } from "../../test/testUtils.js";
import { UserDropdown } from "./UserDropdown.js";

const mockCustomer: AuthUser = {
  id: "user-1",
  email: "customer@example.com",
  fullName: "Nguyễn Văn A",
  role: "CUSTOMER",
  status: "ACTIVE",
  authProvider: "LOCAL"
};

const mockGoogleUser: AuthUser = {
  id: "user-2",
  email: "google@example.com",
  fullName: "Trần Thị B",
  role: "CUSTOMER",
  status: "ACTIVE",
  authProvider: "GOOGLE"
};

const mockAdminUser: AuthUser = {
  id: "admin-1",
  email: "admin@example.com",
  fullName: "Quản Trị Viên",
  role: "ADMIN",
  status: "ACTIVE",
  authProvider: "LOCAL"
};

describe("UserDropdown", () => {
  it("renders trigger button with avatar initial and user full name", () => {
    renderWithProviders(
      <MemoryRouter>
        <UserDropdown user={mockCustomer} onOpenChangePassword={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText("N")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Văn A")).toBeInTheDocument();
  });

  it("opens dropdown menu on trigger click and displays user profile and actions", () => {
    const onOpenChangePassword = vi.fn();
    renderWithProviders(
      <MemoryRouter>
        <UserDropdown user={mockCustomer} onOpenChangePassword={onOpenChangePassword} />
      </MemoryRouter>
    );

    const trigger = screen.getByRole("button", { name: /Tài khoản người dùng/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByText("customer@example.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Lịch sử đơn hàng/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Đổi mật khẩu/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Đăng xuất/i })).toBeInTheDocument();
  });

  it("calls onOpenChangePassword and closes menu when clicking change password", () => {
    const onOpenChangePassword = vi.fn();
    renderWithProviders(
      <MemoryRouter>
        <UserDropdown user={mockCustomer} onOpenChangePassword={onOpenChangePassword} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Tài khoản người dùng/i }));
    const changePasswordBtn = screen.getByRole("menuitem", { name: /Đổi mật khẩu/i });
    fireEvent.click(changePasswordBtn);

    expect(onOpenChangePassword).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu", { name: /Menu tài khoản/i })).not.toBeInTheDocument();
  });

  it("renders Google account indicator instead of change password button for Google users", () => {
    renderWithProviders(
      <MemoryRouter>
        <UserDropdown user={mockGoogleUser} onOpenChangePassword={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Tài khoản người dùng/i }));
    expect(screen.queryByRole("menuitem", { name: /Đổi mật khẩu/i })).not.toBeInTheDocument();
    expect(screen.getByText("Tài khoản Google")).toBeInTheDocument();
  });

  it("renders Admin badge and admin navigation button for admin users", () => {
    renderWithProviders(
      <MemoryRouter>
        <UserDropdown user={mockAdminUser} onOpenChangePassword={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Tài khoản người dùng/i }));
    expect(screen.getByRole("menuitem", { name: /Trang quản trị/i })).toBeInTheDocument();
    expect(screen.getByText("Quản trị viên")).toBeInTheDocument();
  });

  it("closes dropdown when Escape key is pressed", () => {
    renderWithProviders(
      <MemoryRouter>
        <UserDropdown user={mockCustomer} onOpenChangePassword={vi.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Tài khoản người dùng/i }));
    expect(screen.getByRole("menu", { name: /Menu tài khoản/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: /Menu tài khoản/i })).not.toBeInTheDocument();
  });
});
