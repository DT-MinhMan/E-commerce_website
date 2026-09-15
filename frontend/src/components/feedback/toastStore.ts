import { create } from "zustand";

export interface CartToastProduct {
  name: string;
  imageUrl?: string;
  imageAlt?: string;
  priceFormatted?: string;
}

export interface CartToastItem {
  id: string;
  type: "cart";
  product: CartToastProduct;
}

export interface ErrorToastItem {
  id: string;
  type: "error";
  message: string;
}

export interface SuccessToastItem {
  id: string;
  type: "success";
  title?: string;
  message: string;
}

export type ToastItem = CartToastItem | ErrorToastItem | SuccessToastItem;

interface ToastStoreState {
  toasts: ToastItem[];
  addCartToast: (product: CartToastProduct) => void;
  addErrorToast: (message: string) => void;
  addSuccessToast: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const MAX_TOASTS = 3;

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  addCartToast: (product) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => {
      const updated = [...state.toasts, { id, type: "cart" as const, product }];
      return {
        toasts: updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated
      };
    });
  },
  addErrorToast: (message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => {
      const updated = [...state.toasts, { id, type: "error" as const, message }];
      return {
        toasts: updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated
      };
    });
  },
  addSuccessToast: (message, title) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => {
      const updated = [...state.toasts, { id, type: "success" as const, message, title }];
      return {
        toasts: updated.length > MAX_TOASTS ? updated.slice(-MAX_TOASTS) : updated
      };
    });
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },
  clearToasts: () => {
    set({ toasts: [] });
  }
}));
