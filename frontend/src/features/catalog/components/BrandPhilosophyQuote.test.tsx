import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/testUtils.js";
import { BrandPhilosophyQuote } from "./BrandPhilosophyQuote.js";

describe("BrandPhilosophyQuote Component", () => {
  it("renders the Vietnamese slow-living quote and brand description", () => {
    renderWithProviders(<BrandPhilosophyQuote />);

    expect(screen.getByText("Về Chúng Tôi")).toBeInTheDocument();
    expect(
      screen.getByText(/Chúng tôi tin vào vẻ đẹp của lối sống chậm/i)
    ).toBeInTheDocument();
    expect(screen.getByText("lắng lại")).toBeInTheDocument();
    expect(
      screen.getByText(/Mỗi tuyệt phẩm trong bộ sưu tập đều được tuyển chọn kỹ lưỡng/i)
    ).toBeInTheDocument();
  });

  it("does not render a button or link to read story", () => {
    renderWithProviders(<BrandPhilosophyQuote />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(/read our story/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/xem câu chuyện/i)).not.toBeInTheDocument();
  });
});
