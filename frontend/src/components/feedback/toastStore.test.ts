import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "./toastStore.js";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it("initializes with empty toasts", () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("adds a cart toast with product information", () => {
    useToastStore.getState().addCartToast({
      name: "Sofa Gỗ Cao Cấp",
      imageUrl: "https://example.com/sofa.jpg",
      priceFormatted: "15.000.000 ₫"
    });

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("cart");
    if (toasts[0].type === "cart") {
      expect(toasts[0].product.name).toBe("Sofa Gỗ Cao Cấp");
      expect(toasts[0].product.priceFormatted).toBe("15.000.000 ₫");
    }
  });

  it("adds an error toast with error message", () => {
    useToastStore.getState().addErrorToast("Sản phẩm đã hết hàng");

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("error");
    if (toasts[0].type === "error") {
      expect(toasts[0].message).toBe("Sản phẩm đã hết hàng");
    }
  });

  it("adds a success toast with message and optional title", () => {
    useToastStore.getState().addSuccessToast("Đổi mật khẩu thành công!", "Thành công");

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].type).toBe("success");
    if (toasts[0].type === "success") {
      expect(toasts[0].message).toBe("Đổi mật khẩu thành công!");
      expect(toasts[0].title).toBe("Thành công");
    }
  });

  it("limits toasts to a maximum of 3 and drops the oldest", () => {
    useToastStore.getState().addErrorToast("Error 1");
    useToastStore.getState().addErrorToast("Error 2");
    useToastStore.getState().addErrorToast("Error 3");
    useToastStore.getState().addErrorToast("Error 4");

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(3);
    if (toasts[0].type === "error" && toasts[1].type === "error" && toasts[2].type === "error") {
      expect(toasts[0].message).toBe("Error 2");
      expect(toasts[1].message).toBe("Error 3");
      expect(toasts[2].message).toBe("Error 4");
    }
  });

  it("removes a toast by ID", () => {
    useToastStore.getState().addErrorToast("Error to remove");
    const id = useToastStore.getState().toasts[0].id;

    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("clears all toasts", () => {
    useToastStore.getState().addErrorToast("Error 1");
    useToastStore.getState().addErrorToast("Error 2");

    useToastStore.getState().clearToasts();
    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
