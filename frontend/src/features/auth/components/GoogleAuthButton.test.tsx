import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoogleAuthButton } from "./GoogleAuthButton.js";

vi.mock("../../../config/env.js", () => ({
  config: {
    apiBaseUrl: "http://localhost:3000",
    googleClientId: undefined
  }
}));

describe("GoogleAuthButton", () => {
  it("renders null and does not throw when googleClientId is not configured", () => {
    const { container } = render(<GoogleAuthButton />);
    expect(container.firstChild).toBeNull();
  });
});
