import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductGallery } from "./ProductGallery.js";
import type { ProductImage } from "../types.js";

const mockImages: ProductImage[] = [
  { url: "https://example.com/img1.jpg", alt: "Bàn trà gỗ sồi góc 1" },
  { url: "https://example.com/img2.jpg", alt: "Bàn trà gỗ sồi góc 2" },
  { url: "https://example.com/img3.jpg", alt: "Bàn trà gỗ sồi chi tiết chân bàn" },
  { url: "https://example.com/img4.jpg", alt: "Bàn trà trong không gian phòng khách" }
];

describe("ProductGallery", () => {
  it("renders placeholder when 0 images are provided", () => {
    render(<ProductGallery images={[]} productName="Bàn trà gỗ sồi" />);

    expect(screen.getByText("Không có hình ảnh")).toBeInTheDocument();
    expect(screen.queryByLabelText("Ảnh trước")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ảnh tiếp theo")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  it("renders single image without thumbnails, nav buttons, or counter", () => {
    render(
      <ProductGallery
        images={[{ url: "https://example.com/single.jpg", alt: "Ảnh đơn" }]}
        productName="Bàn trà gỗ sồi"
      />
    );

    const mainImg = screen.getByRole("img", { name: /Ảnh đơn/i });
    expect(mainImg).toHaveAttribute("src", "https://example.com/single.jpg");
    expect(screen.queryByLabelText("Ảnh trước")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Ảnh tiếp theo")).not.toBeInTheDocument();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByText(/1 \/ 1/)).not.toBeInTheDocument();
  });

  it("renders multi images with counter and thumbnails", () => {
    render(<ProductGallery images={mockImages} productName="Bàn trà gỗ sồi" />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByLabelText("Ảnh trước")).toBeInTheDocument();
    expect(screen.getByLabelText("Ảnh tiếp theo")).toBeInTheDocument();

    const thumbnails = screen.getAllByRole("tab");
    expect(thumbnails).toHaveLength(4);
    expect(thumbnails[0]).toHaveAttribute("aria-selected", "true");
  });

  it("navigates to next and previous image via navigation buttons", () => {
    render(<ProductGallery images={mockImages} productName="Bàn trà gỗ sồi" />);

    const nextBtn = screen.getByLabelText("Ảnh tiếp theo");
    const prevBtn = screen.getByLabelText("Ảnh trước");

    // Click Next: 1 -> 2
    fireEvent.click(nextBtn);
    expect(screen.getByRole("img", { name: /^Bàn trà gỗ sồi góc 2$/i })).toBeInTheDocument();

    // Click Next: 2 -> 3
    fireEvent.click(nextBtn);
    expect(screen.getByRole("img", { name: /^Bàn trà gỗ sồi chi tiết chân bàn$/i })).toBeInTheDocument();

    // Click Prev: 3 -> 2
    fireEvent.click(prevBtn);
    expect(screen.getByRole("img", { name: /^Bàn trà gỗ sồi góc 2$/i })).toBeInTheDocument();

    // Prev again: 2 -> 1
    fireEvent.click(prevBtn);
    expect(screen.getByRole("img", { name: /^Bàn trà gỗ sồi góc 1$/i })).toBeInTheDocument();

    // Prev wrap-around: 1 -> 4
    fireEvent.click(prevBtn);
    expect(screen.getByRole("img", { name: /^Bàn trà trong không gian phòng khách$/i })).toBeInTheDocument();
  });

  it("changes image when clicking thumbnail", () => {
    render(<ProductGallery images={mockImages} productName="Bàn trà gỗ sồi" />);

    const thumb3 = screen.getByLabelText("Xem hình ảnh 3");
    fireEvent.click(thumb3);

    expect(thumb3).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: /^Bàn trà gỗ sồi chi tiết chân bàn$/i })).toBeInTheDocument();
  });

  it("supports keyboard arrow navigation", () => {
    render(<ProductGallery images={mockImages} productName="Bàn trà gỗ sồi" />);

    const gallery = screen.getByRole("region", { name: /Bộ sưu tập hình ảnh/i });

    // Press ArrowRight: 1 -> 2
    fireEvent.keyDown(gallery, { key: "ArrowRight" });
    expect(screen.getByRole("img", { name: /^Bàn trà gỗ sồi góc 2$/i })).toBeInTheDocument();

    // Press ArrowLeft: 2 -> 1
    fireEvent.keyDown(gallery, { key: "ArrowLeft" });
    expect(screen.getByRole("img", { name: /^Bàn trà gỗ sồi góc 1$/i })).toBeInTheDocument();
  });

  it("opens and closes lightbox modal", () => {
    render(<ProductGallery images={mockImages} productName="Bàn trà gỗ sồi" />);

    const expandBtn = screen.getByLabelText("Phóng to ảnh");
    fireEvent.click(expandBtn);

    const dialog = screen.getByRole("dialog", { name: /Xem ảnh phóng to/i });
    expect(dialog).toBeInTheDocument();

    // Close via close button
    const closeBtn = screen.getByLabelText("Đóng xem ảnh");
    fireEvent.click(closeBtn);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Reopen and close via Escape
    fireEvent.click(expandBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("traps focus within lightbox when Tab and Shift+Tab are pressed", () => {
    render(<ProductGallery images={mockImages} productName="Bàn trà gỗ sồi" />);

    const expandBtn = screen.getByLabelText("Phóng to ảnh");
    fireEvent.click(expandBtn);

    const dialog = screen.getByRole("dialog", { name: /Xem ảnh phóng to/i });
    const closeBtn = within(dialog).getByLabelText("Đóng xem ảnh");
    const prevBtn = within(dialog).getByLabelText("Ảnh trước");
    const nextBtn = within(dialog).getByLabelText("Ảnh tiếp theo");

    // Initially focused on close button
    expect(closeBtn).toHaveFocus();
    expect(prevBtn).toBeInTheDocument();

    // Tab moves focus: close -> prev
    fireEvent.keyDown(window, { key: "Tab" });
    // Note: in jsdom fireEvent.keyDown doesn't naturally trigger browser focus change unless handler calls .focus(), which our trap does when wrapping or out-of-bounds
    // Let's test that tabbing on the last element wraps to the first
    nextBtn.focus();
    expect(nextBtn).toHaveFocus();
    fireEvent.keyDown(window, { key: "Tab" });
    expect(closeBtn).toHaveFocus();

    // Shift+Tab on first element wraps to last element
    closeBtn.focus();
    expect(closeBtn).toHaveFocus();
    fireEvent.keyDown(window, { key: "Tab", shiftKey: true });
    expect(nextBtn).toHaveFocus();
  });

  it("restores focus to trigger element when lightbox closes", () => {
    render(<ProductGallery images={mockImages} productName="Bàn trà gỗ sồi" />);

    const expandBtn = screen.getByLabelText("Phóng to ảnh");
    expandBtn.focus();
    expect(expandBtn).toHaveFocus();

    fireEvent.click(expandBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(expandBtn).toHaveFocus();
  });
});
