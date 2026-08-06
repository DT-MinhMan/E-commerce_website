import { renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAdminOrderStatus } from "../features/admin/services/adminService.js";
import { addCartItem } from "../features/cart/services/cartService.js";
import type { Order } from "../features/orders/types.js";
import type { Cart } from "../features/cart/types.js";
import { createTestQueryClient } from "../test/testUtils.js";
import { useAuthStore } from "../features/auth/store/authStore.js";
import { adminDashboardKeys, adminOrderKeys, useUpdateAdminOrderStatus } from "../features/admin/hooks/useAdminQueries.js";
import { cartKeys, useAddCartItem } from "../features/cart/hooks/useCartQueries.js";
import { orderKeys } from "../features/orders/hooks/useOrderQueries.js";
import { isPaymentPollingTerminal } from "../features/payments/hooks/usePaymentQueries.js";

vi.mock("../features/admin/services/adminService.js", async () => {
  const actual = await vi.importActual<typeof import("../features/admin/services/adminService.js")>("../features/admin/services/adminService.js");
  return {
    ...actual,
    updateAdminOrderStatus: vi.fn()
  };
});

vi.mock("../features/cart/services/cartService.js", async () => {
  const actual = await vi.importActual<typeof import("../features/cart/services/cartService.js")>("../features/cart/services/cartService.js");
  return {
    ...actual,
    addCartItem: vi.fn()
  };
});

const mockedUpdateAdminOrderStatus = vi.mocked(updateAdminOrderStatus);
const mockedAddCartItem = vi.mocked(addCartItem);

const testOrder = (overrides: Partial<Order> = {}): Order => ({
  id: "order-1",
  orderNumber: "ORD-20260801-000001",
  items: [],
  shippingAddress: {
    recipientName: "Customer",
    phone: "1234567890",
    addressLine1: "123 Test Street",
    city: "Test City",
    stateOrProvince: "Test State",
    postalCode: "12345",
    countryCode: "US"
  },
  subtotalMinor: 1000,
  shippingFeeMinor: 0,
  totalMinor: 1000,
  currency: "USD",
  orderStatus: "PROCESSING",
  paymentStatus: "SUCCEEDED",
  paidAt: "2026-08-01T00:00:00.000Z",
  cancelledAt: null,
  completedAt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  ...overrides
});

const testCart = (itemCount: number): Cart => ({
  id: "cart-1",
  items: [],
  itemCount,
  subtotalMinor: itemCount * 1000,
  currency: "USD"
});

const createWrapper = (queryClient = createTestQueryClient()) => {
  const Wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  return { queryClient, Wrapper };
};

describe("query cache behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().setStatus("authenticated");
  });

  it("uses isolated QueryClient instances for tests", () => {
    const first = createTestQueryClient();
    const second = createTestQueryClient();

    first.setQueryData(cartKeys.current(), testCart(2));

    expect(first.getQueryData(cartKeys.current())).toMatchObject({ itemCount: 2 });
    expect(second.getQueryData(cartKeys.current())).toBeUndefined();
  });

  it("updates current cart cache from cart mutation responses", async () => {
    mockedAddCartItem.mockResolvedValue(testCart(3));
    const { queryClient, Wrapper } = createWrapper();
    const { result } = renderHook(() => useAddCartItem(), { wrapper: Wrapper });

    result.current.mutate({ productId: "product-1", quantity: 3 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(cartKeys.current())).toMatchObject({ itemCount: 3 });
  });

  it("targets admin and customer order caches after admin status updates", async () => {
    const order = testOrder();
    mockedUpdateAdminOrderStatus.mockResolvedValue(order);
    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateAdminOrderStatus(order.id), { wrapper: Wrapper });

    result.current.mutate({ expectedCurrentStatus: "PAID", nextStatus: "PROCESSING" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(adminOrderKeys.detail(order.id))).toEqual(order);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminOrderKeys.lists() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: orderKeys.lists() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: orderKeys.detail(order.id) });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: adminDashboardKeys.summary() });
  });

  it("treats terminal payment and order statuses as polling stop conditions", () => {
    expect(
      isPaymentPollingTerminal({
        payment: {
          orderId: "order-1",
          status: "SUCCEEDED",
          amountMinor: 1000,
          currency: "USD",
          provider: "STRIPE",
          providerCheckoutSessionId: "cs_test",
          providerPaymentId: "pi_test",
          paidAt: "2026-08-01T00:00:00.000Z",
          failureCode: null,
          failureMessage: null
        },
        order: {
          id: "order-1",
          orderStatus: "PAID",
          paymentStatus: "SUCCEEDED",
          paidAt: "2026-08-01T00:00:00.000Z"
        }
      })
    ).toBe(true);

    expect(
      isPaymentPollingTerminal({
        payment: {
          orderId: "order-2",
          status: "PENDING",
          amountMinor: 1000,
          currency: "USD",
          provider: "STRIPE",
          providerCheckoutSessionId: "cs_test",
          providerPaymentId: null,
          paidAt: null,
          failureCode: null,
          failureMessage: null
        },
        order: {
          id: "order-2",
          orderStatus: "PENDING_PAYMENT",
          paymentStatus: "PENDING",
          paidAt: null
        }
      })
    ).toBe(false);
  });
});
