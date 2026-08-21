import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAdminOrdersQuery } from "../../admin/hooks/useAdminQueries.js";
import type { AdminOrderListParams, OrderStatus, PaymentStatus } from "../../admin/types.js";

const getStatusPillClass = (status: string): string => {
  const lower = status.toLowerCase();
  if (lower.includes("paid") || lower.includes("shipped") || lower.includes("completed")) {
    return "status-pill paid";
  }
  if (lower.includes("pending") || lower.includes("processing")) {
    return "status-pill pending";
  }
  return "status-pill cancelled";
};

const translateStatus = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đang giao hàng",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
    RETURNED: "Đã hoàn trả",
    REFUNDED: "Đã hoàn tiền",
    PAYMENT_REVIEW: "Kiểm tra thanh toán"
  };
  return map[status] || status;
};

const translatePaymentStatus = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    PROCESSING: "Đang xử lý",
    PAID: "Đã thanh toán",
    SUCCEEDED: "Đã thanh toán",
    FAILED: "Thất bại",
    CANCELLED: "Đã hủy",
    REFUNDED: "Đã hoàn tiền"
  };
  return map[status] || status;
};

const ORDER_STATUS_TABS: Array<{ value: OrderStatus | ""; label: string }> = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "SHIPPED", label: "Đang giao hàng" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "RETURNED", label: "Đã hoàn trả" }
];

const paramsFromSearch = (searchParams: URLSearchParams): AdminOrderListParams => ({
  page: Number(searchParams.get("page") ?? 1),
  limit: 20,
  ...(searchParams.get("q") ? { q: searchParams.get("q") ?? undefined } : {}),
  ...(searchParams.get("orderStatus") ? { orderStatus: (searchParams.get("orderStatus") as OrderStatus) ?? undefined } : {}),
  ...(searchParams.get("paymentStatus") ? { paymentStatus: (searchParams.get("paymentStatus") as PaymentStatus) ?? undefined } : {})
});

export const AdminOrdersView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeParams = paramsFromSearch(searchParams);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") ?? "");

  // Sync search input local state if URL changes externally (e.g. clear filters)
  const currentQueryParam = searchParams.get("q") ?? "";
  useEffect(() => {
    setSearchTerm(currentQueryParam);
  }, [currentQueryParam]);

  // Debounce search update (300ms)
  useEffect(() => {
    if (searchTerm === currentQueryParam) return;

    const handler = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (searchTerm.trim()) {
        next.set("q", searchTerm.trim());
      } else {
        next.delete("q");
      }
      next.delete("page");
      setSearchParams(next);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, currentQueryParam, searchParams, setSearchParams]);

  const ordersQuery = useAdminOrdersQuery(activeParams);
  const orders = ordersQuery.data?.orders ?? [];
  const meta = ordersQuery.data?.meta;

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  };

  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) {
      next.set("page", String(nextPage));
    } else {
      next.delete("page");
    }
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(searchParams.get("q") || searchParams.get("orderStatus"));

  return (
    <section className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link> / <span>Đơn hàng</span>
          </div>
          <h2>Quản lý Đơn hàng</h2>
          <p className="admin-header-desc">Theo dõi tiến độ xử lý đơn hàng, trạng thái thanh toán và thông tin giao hàng.</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-filter-card">
        <div className="filter-item search-box">
          <label>Tìm kiếm đơn hàng</label>
          <div className="input-with-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Nhập mã đơn, tên khách hàng hoặc SĐT..."
            />
            {searchTerm && (
              <button
                type="button"
                className="input-clear-btn"
                onClick={() => setSearchTerm("")}
                title="Xóa từ khóa"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="admin-status-tabs">
        {ORDER_STATUS_TABS.map((tab) => {
          const isActive = (searchParams.get("orderStatus") ?? "") === tab.value;
          return (
            <button
              key={tab.value || "all"}
              type="button"
              className={`status-tab-btn ${isActive ? "active" : ""}`}
              onClick={() => updateParam("orderStatus", tab.value)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {ordersQuery.isLoading && (
        <div className="panel admin-loading-panel">
          <div className="admin-spinner" />
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      )}

      {/* Error State */}
      {ordersQuery.isError && (
        <div className="panel admin-error-panel">
          <p className="status-error">{ordersQuery.error.message}</p>
        </div>
      )}

      {/* Empty State */}
      {ordersQuery.isSuccess && orders.length === 0 && (
        <div className="panel empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          </svg>
          {hasActiveFilters ? (
            <>
              <h3>Không tìm thấy đơn hàng phù hợp</h3>
              <p>Thử điều chỉnh từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc đang áp dụng.</p>
              <button type="button" className="admin-btn secondary mt-12" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            </>
          ) : (
            <>
              <h3>Chưa phát sinh đơn hàng</h3>
              <p>Danh sách đơn đặt hàng từ khách hàng sẽ xuất hiện tại đây.</p>
            </>
          )}
        </div>
      )}

      {/* Order Table */}
      {orders.length > 0 && (
        <>
          <div className="admin-card-table">
            <div className="table-header-row order-header-row">
              <span>Mã đơn hàng</span>
              <span>Trạng thái đơn</span>
              <span>Thanh toán</span>
              <span className="col-actions">Thao tác</span>
            </div>

            <div className="table-body">
              {orders.map((order) => (
                <div className="table-row-card order-row-card" key={order.id}>
                  <div className="order-number-cell">
                    <div className="order-icon-box">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      </svg>
                    </div>
                    <div>
                      <strong className="order-code">{order.orderNumber}</strong>
                      {order.shippingAddress?.recipientName && (
                        <span className="text-muted-sm block">{order.shippingAddress.recipientName}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className={getStatusPillClass(order.orderStatus)}>
                      {translateStatus(order.orderStatus)}
                    </span>
                  </div>

                  <div>
                    <span className={`status-pill ${order.paymentStatus === "PAID" || order.paymentStatus === "SUCCEEDED" ? "paid" : order.paymentStatus === "FAILED" ? "cancelled" : "pending"}`}>
                      {translatePaymentStatus(order.paymentStatus)}
                    </span>
                  </div>

                  <div className="col-actions">
                    <Link className="admin-btn-sm secondary" to={`/admin/orders/${order.id}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>Chi tiết</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <nav className="pagination mt-16" aria-label="Phân trang đơn hàng">
              <button
                type="button"
                className="admin-btn-sm secondary"
                disabled={activeParams.page <= 1}
                onClick={() => setPage(activeParams.page - 1)}
              >
                Trang trước
              </button>
              <span className="pagination-info">
                Trang {meta.page} / {meta.totalPages} ({meta.totalItems} đơn hàng)
              </span>
              <button
                type="button"
                className="admin-btn-sm secondary"
                disabled={activeParams.page >= meta.totalPages}
                onClick={() => setPage(activeParams.page + 1)}
              >
                Trang sau
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
};
