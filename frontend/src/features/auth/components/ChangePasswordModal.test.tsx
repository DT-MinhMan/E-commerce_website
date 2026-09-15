import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/testUtils.js";
import { ChangePasswordModal } from "./ChangePasswordModal.js";

describe("ChangePasswordModal", () => {
  it("does not render when isOpen is false", () => {
    const { container } = renderWithProviders(
      <ChangePasswordModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal dialog and form inputs when isOpen is true", () => {
    renderWithProviders(
      <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Đổi mật khẩu" })).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu hiện tại")).toBeInTheDocument();
    expect(screen.getByLabelText("Mật khẩu mới")).toBeInTheDocument();
    expect(screen.getByLabelText("Xác nhận mật khẩu mới")).toBeInTheDocument();
  });

  it("validates required current password", () => {
    renderWithProviders(
      <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(screen.getByText("Vui lòng nhập mật khẩu hiện tại.")).toBeInTheDocument();
  });

  it("validates new password format and length", () => {
    renderWithProviders(
      <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
    );

    fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), {
      target: { value: "OldPassword123" }
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "short" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(
      screen.getByText("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm cả chữ và số.")
    ).toBeInTheDocument();
  });

  it("validates new password cannot be same as current password", () => {
    renderWithProviders(
      <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
    );

    fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), {
      target: { value: "SamePassword123" }
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "SamePassword123" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(
      screen.getByText("Mật khẩu mới không được trùng với mật khẩu hiện tại.")
    ).toBeInTheDocument();
  });

  it("validates confirm password mismatch", () => {
    renderWithProviders(
      <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
    );

    fireEvent.change(screen.getByLabelText("Mật khẩu hiện tại"), {
      target: { value: "OldPassword123" }
    });
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), {
      target: { value: "NewPassword123" }
    });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), {
      target: { value: "DifferentPassword123" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(screen.getByText("Xác nhận mật khẩu mới không khớp.")).toBeInTheDocument();
  });

  it("toggles password visibility between password and text", () => {
    renderWithProviders(
      <ChangePasswordModal isOpen={true} onClose={vi.fn()} />
    );

    const currentInput = screen.getByLabelText("Mật khẩu hiện tại");
    expect(currentInput).toHaveAttribute("type", "password");

    const toggleBtn = screen.getByRole("button", { name: "Hiện mật khẩu hiện tại" });
    fireEvent.click(toggleBtn);

    expect(currentInput).toHaveAttribute("type", "text");
  });

  it("calls onClose when clicking Cancel button or close icon", () => {
    const onClose = vi.fn();
    renderWithProviders(
      <ChangePasswordModal isOpen={true} onClose={onClose} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Đóng cửa sổ đổi mật khẩu" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
