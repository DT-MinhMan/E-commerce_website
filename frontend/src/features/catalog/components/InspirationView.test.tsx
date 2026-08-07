import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/testUtils.js";
import { InspirationView } from "./InspirationView.js";

describe("InspirationView Component", () => {
  it("renders hero title, intro, and all alternating zig-zag items", () => {
    renderWithProviders(
      <MemoryRouter>
        <InspirationView />
      </MemoryRouter>
    );

    expect(screen.getByText("Ý Tưởng Kiến Tạo Không Gian Sống")).toBeInTheDocument();
    expect(screen.getByText("— Đội Ngũ Thiết Kế ZenLiving —")).toBeInTheDocument();
    expect(screen.getByText("Gợi Ý Bài Trí Nội Thất ZenLiving")).toBeInTheDocument();

    expect(screen.getByText("01 / PHÒNG KHÁCH")).toBeInTheDocument();
    expect(screen.getByText("Không Gian Sống Tối Giản & Sang Trọng")).toBeInTheDocument();

    expect(screen.getByText("02 / PHÒNG ĂN")).toBeInTheDocument();
    expect(screen.getByText("Góc Bữa Ăn Ấm Cúng Cho Gia Đình")).toBeInTheDocument();

    expect(screen.getByText("03 / PHÒNG NGỦ")).toBeInTheDocument();
    expect(screen.getByText("Chốn Bình Yên Tái Tạo Năng Lượng")).toBeInTheDocument();

    expect(screen.getByText("04 / ĐỒ TRANG TRÍ & ĐÈN")).toBeInTheDocument();
    expect(screen.getByText("Điểm Nhấn Nghệ Thuật Cho Từng Góc Nhỏ")).toBeInTheDocument();
  });

  it("does not render consultation registration form", () => {
    renderWithProviders(
      <MemoryRouter>
        <InspirationView />
      </MemoryRouter>
    );

    expect(screen.queryByText("Đăng Ký Tư Vấn Thiết Kế Không Gian Sống")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Đăng Ký Tư Vấn/i })).not.toBeInTheDocument();
  });
});
