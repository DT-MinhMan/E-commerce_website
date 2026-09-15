import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/testUtils.js";
import { ProductDetailView } from "./ProductDetailView.js";
import type { Category, Product } from "../types.js";

const mockCategory: Category = {
  id: "cat-1",
  name: "Bàn & Ghế",
  slug: "ban-ghe",
  status: "ACTIVE",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01"
};

const mockProduct: Product = {
  id: "prod-1",
  name: "Bàn Trà Gỗ Sồi Bắc Âu",
  slug: "ban-tra-go-soi-bac-au",
  description: "Thiết kế tối giản phong cách Bắc Âu mang lại vẻ đẹp tự nhiên.",
  categoryId: "cat-1",
  roomType: "LIVING_ROOM",
  priceMinor: 3500000,
  currency: "VND",
  stockQuantity: 8,
  images: [
    { url: "https://example.com/p1.jpg", alt: "Bàn trà góc 1" },
    { url: "https://example.com/p2.jpg", alt: "Bàn trà góc 2" }
  ],
  status: "ACTIVE",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01"
};

const mockRelatedProduct: Product = {
  id: "prod-2",
  name: "Ghế Armchair Gỗ Sồi",
  slug: "ghe-armchair-go-soi",
  description: "Ghế thư giãn nệm êm ái.",
  categoryId: "cat-1",
  roomType: "LIVING_ROOM",
  priceMinor: 2800000,
  currency: "VND",
  stockQuantity: 4,
  images: [{ url: "https://example.com/p3.jpg", alt: "Ghế góc 1" }],
  status: "ACTIVE",
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01"
};

// Mock queries
vi.mock("../hooks/useCatalogQueries.js", () => ({
  useProductDetailQuery: vi.fn(),
  useCategoriesQuery: vi.fn(),
  useProductsQuery: vi.fn()
}));

vi.mock("../../cart/hooks/useCartQueries.js", () => ({
  useAddCartItem: vi.fn()
}));

vi.mock("../../auth/store/authStore.js", () => ({
  useAuthStore: vi.fn()
}));

import { useCategoriesQuery, useProductDetailQuery, useProductsQuery } from "../hooks/useCatalogQueries.js";
import { useAddCartItem } from "../../cart/hooks/useCartQueries.js";
import { useAuthStore } from "../../auth/store/authStore.js";

describe("ProductDetailView", () => {
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn()
    }));

    window.scrollTo = vi.fn();

    vi.mocked(useAuthStore).mockImplementation(((selector: (state: unknown) => unknown) =>
      selector({ user: { id: "u-1", email: "user@example.com" } })
    ) as unknown as typeof useAuthStore);

    vi.mocked(useAddCartItem).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      variables: undefined,
      error: null
    } as unknown as ReturnType<typeof useAddCartItem>);

    vi.mocked(useCategoriesQuery).mockReturnValue({
      data: [mockCategory],
      isLoading: false
    } as unknown as ReturnType<typeof useCategoriesQuery>);

    vi.mocked(useProductDetailQuery).mockReturnValue({
      data: mockProduct,
      isLoading: false,
      isError: false
    } as unknown as ReturnType<typeof useProductDetailQuery>);

    vi.mocked(useProductsQuery).mockReturnValue({
      data: {
        products: [mockProduct, mockRelatedProduct],
        meta: { page: 1, limit: 5, totalItems: 2, totalPages: 1 }
      },
      isLoading: false
    } as unknown as ReturnType<typeof useProductsQuery>);
  });

  it("renders breadcrumbs, product information, and smart stock pill", () => {
    renderWithProviders(
      <MemoryRouter>
        <ProductDetailView />
      </MemoryRouter>
    );

    // Breadcrumbs
    expect(screen.getByRole("navigation", { name: "Đường dẫn trang" })).toBeInTheDocument();
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText("Sản phẩm")).toBeInTheDocument();
    expect(screen.getAllByText("Bàn & Ghế").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Bàn Trà Gỗ Sồi Bắc Âu").length).toBeGreaterThanOrEqual(1);

    // Product info
    expect(screen.getByText("Phòng khách")).toBeInTheDocument();
    expect(screen.getAllByText("Còn hàng").length).toBeGreaterThanOrEqual(1);

    // Trust badges
    expect(screen.getByText("Giao hàng chuyên dụng cho đồ decor")).toBeInTheDocument();
    expect(screen.getByText("Đổi trả miễn phí trong 30 ngày")).toBeInTheDocument();
    expect(screen.getByText("Bảo hành chính hãng 12 tháng")).toBeInTheDocument();
    expect(screen.getByText("Đồng kiểm hàng khi nhận")).toBeInTheDocument();
  });

  it("handles quantity selector increments and decrements", () => {
    renderWithProviders(
      <MemoryRouter>
        <ProductDetailView />
      </MemoryRouter>
    );

    const input = screen.getByLabelText("Số lượng sản phẩm") as HTMLInputElement;
    expect(input.value).toBe("1");

    const plusBtn = screen.getByLabelText("Tăng số lượng");
    const minusBtn = screen.getByLabelText("Giảm số lượng");

    // Increment
    fireEvent.click(plusBtn);
    expect(input.value).toBe("2");

    // Decrement
    fireEvent.click(minusBtn);
    expect(input.value).toBe("1");

    // Minus disabled when quantity is 1
    expect(minusBtn).toBeDisabled();
  });

  it("renders tabs and switches active panel on tab click", () => {
    renderWithProviders(
      <MemoryRouter>
        <ProductDetailView />
      </MemoryRouter>
    );

    // Default description tab active
    expect(screen.getByRole("tab", { name: "Mô tả sản phẩm" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getAllByText(mockProduct.description).length).toBeGreaterThanOrEqual(1);

    // Click warranty tab
    const warrantyTab = screen.getByRole("tab", { name: "Bảo hành sản phẩm" });
    fireEvent.click(warrantyTab);
    expect(warrantyTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Chính sách bảo hành sản phẩm ZenLiving/)).toBeInTheDocument();
    expect(screen.getByText(/ZenLiving bảo hành 12 tháng/)).toBeInTheDocument();

    // Click shipping tab
    const shippingTab = screen.getByRole("tab", { name: "Vận chuyển & Lắp đặt" });
    fireEvent.click(shippingTab);
    expect(shippingTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText(/Vận chuyển & Lắp đặt tại ZenLiving/)).toBeInTheDocument();
    expect(screen.getByText(/ZenLiving hỗ trợ giao hàng, lắp ráp và sắp xếp/)).toBeInTheDocument();
  });

  it("renders related products from same category excluding current product", () => {
    renderWithProviders(
      <MemoryRouter>
        <ProductDetailView />
      </MemoryRouter>
    );

    expect(screen.getByText("Có thể bạn cũng thích")).toBeInTheDocument();
    expect(screen.getByText("Ghế Armchair Gỗ Sồi")).toBeInTheDocument();
  });

  it("hides quantity selector and disables buttons when product is out of stock", () => {
    vi.mocked(useProductDetailQuery).mockReturnValue({
      data: { ...mockProduct, stockQuantity: 0 },
      isLoading: false,
      isError: false
    } as unknown as ReturnType<typeof useProductDetailQuery>);

    renderWithProviders(
      <MemoryRouter>
        <ProductDetailView />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Hết hàng").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText("Số lượng sản phẩm")).not.toBeInTheDocument();

    const addToCartBtn = screen.getByRole("button", { name: "Hết hàng" });
    expect(addToCartBtn).toBeDisabled();
  });

  it("renders skeleton loading state when product is loading", () => {
    vi.mocked(useProductDetailQuery).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false
    } as unknown as ReturnType<typeof useProductDetailQuery>);

    renderWithProviders(
      <MemoryRouter>
        <ProductDetailView />
      </MemoryRouter>
    );

    const skeleton = screen.getByRole("status", { name: "Đang tải thông tin sản phẩm" });
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute("aria-busy", "true");
  });
});
