import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { ToastContainer } from "./ToastContainer.js";
import { useToastStore } from "./toastStore.js";

describe("ToastContainer", () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it("renders nothing when there are no toasts", () => {
    const { container } = render(
      <MemoryRouter>
        <ToastContainer />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders cart toast with details and link to /cart", () => {
    useToastStore.getState().addCartToast({
      name: "Bàn Ăn Gỗ Sồi",
      imageUrl: "https://example.com/table.jpg",
      priceFormatted: "8.500.000 ₫"
    });

    render(
      <MemoryRouter>
        <ToastContainer />
      </MemoryRouter>
    );

    expect(screen.getByText("Đã thêm vào giỏ hàng")).toBeInTheDocument();
    expect(screen.getByText("Bàn Ăn Gỗ Sồi")).toBeInTheDocument();
    expect(screen.getByText("8.500.000 ₫")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem giỏ hàng/ })).toHaveAttribute("href", "/cart");
  });

  it("renders error toast with error message", () => {
    useToastStore.getState().addErrorToast("Không thể kết nối đến máy chủ");

    render(
      <MemoryRouter>
        <ToastContainer />
      </MemoryRouter>
    );

    expect(screen.getByText("Không thể thêm vào giỏ hàng")).toBeInTheDocument();
    expect(screen.getByText("Không thể kết nối đến máy chủ")).toBeInTheDocument();
  });

  it("renders success toast with message and custom title", () => {
    useToastStore.getState().addSuccessToast("Đổi mật khẩu thành công!", "Đã cập nhật");

    render(
      <MemoryRouter>
        <ToastContainer />
      </MemoryRouter>
    );

    expect(screen.getByText("Đã cập nhật")).toBeInTheDocument();
    expect(screen.getByText("Đổi mật khẩu thành công!")).toBeInTheDocument();
  });

  it("dismisses toast when clicking close button", () => {
    useToastStore.getState().addErrorToast("Thông báo cần đóng");

    render(
      <MemoryRouter>
        <ToastContainer />
      </MemoryRouter>
    );

    const closeBtn = screen.getByRole("button", { name: "Đóng thông báo" });
    fireEvent.click(closeBtn);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
