import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScrollReveal } from "./ScrollReveal.js";

describe("ScrollReveal Component", () => {
  it("renders children properly with base classes", () => {
    render(
      <ScrollReveal className="custom-test-class" as="section">
        <div>Nội dung kiểm tra</div>
      </ScrollReveal>
    );

    const textEl = screen.getByText("Nội dung kiểm tra");
    expect(textEl).toBeInTheDocument();

    const sectionEl = textEl.parentElement;
    expect(sectionEl?.tagName.toLowerCase()).toBe("section");
    expect(sectionEl).toHaveClass("scroll-reveal");
    expect(sectionEl).toHaveClass("reveal-up");
    expect(sectionEl).toHaveClass("custom-test-class");
  });

  it("handles direction none for simple fade", () => {
    render(
      <ScrollReveal direction="none">
        <span>Fade only content</span>
      </ScrollReveal>
    );

    const spanEl = screen.getByText("Fade only content");
    expect(spanEl.parentElement).toHaveClass("reveal-fade");
  });

  it("handles direction left, right, and scale properly", () => {
    const { rerender } = render(
      <ScrollReveal direction="left">
        <span>Slide Left</span>
      </ScrollReveal>
    );
    expect(screen.getByText("Slide Left").parentElement).toHaveClass("reveal-left");

    rerender(
      <ScrollReveal direction="right">
        <span>Slide Right</span>
      </ScrollReveal>
    );
    expect(screen.getByText("Slide Right").parentElement).toHaveClass("reveal-right");

    rerender(
      <ScrollReveal direction="scale" scaleFrom={0.95}>
        <span>Scale Up</span>
      </ScrollReveal>
    );
    expect(screen.getByText("Scale Up").parentElement).toHaveClass("reveal-scale");
  });
});

