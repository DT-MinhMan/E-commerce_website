import { Link } from "react-router-dom";
import { useAdminDashboardSummaryQuery } from "../hooks/useAdminQueries.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND"
  }).format(priceMinor / (currency === "VND" ? 1 : 100));

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

export const AdminDashboardView = () => {
  const summaryQuery = useAdminDashboardSummaryQuery();

  if (summaryQuery.isLoading) {
    return (
      <section className="panel">
        <p>Đang tải dữ liệu tổng quan quản trị...</p>
      </section>
    );
  }

  if (summaryQuery.isError) {
    return (
      <section className="panel">
        <h2>Không thể tải bảng điều khiển</h2>
        <p className="status-error">{summaryQuery.error.message}</p>
        <button type="button" className="primary-action" onClick={() => void summaryQuery.refetch()}>
          Thử lại
        </button>
      </section>
    );
  }

  const summary = summaryQuery.data;

  if (!summary) {
    return null;
  }

  return (
    <section className="admin-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow" style={{ color: "var(--color-accent)" }}>Tổng quan hệ thống</p>
          <h2>Bảng điều khiển Admin</h2>
        </div>
        <div className="payment-actions">
          <Link className="primary-link" to="/admin/products/new">
            + Thêm sản phẩm
          </Link>
          <Link className="secondary-action" to="/admin/categories">
            Danh mục
          </Link>
          <Link className="secondary-action" to="/admin/orders">
            Quản lý đơn hàng
          </Link>
        </div>
      </div>

      <div className="admin-stats">
        <article className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Doanh thu đã thanh toán</span>
            <div className="admin-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <h3>{formatPrice(summary.paidRevenueMinor, summary.currency)}</h3>
          <div className="admin-stat-footer">Tổng doanh thu thực nhận từ đơn hàng thành công</div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Tổng số đơn hàng</span>
            <div className="admin-stat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
          </div>
          <h3>{summary.totalOrders}</h3>
          <div className="admin-stat-footer">Tổng đơn hàng đã phát sinh trên cửa hàng</div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-header">
            <span>Sản phẩm sắp hết hàng</span>
            <div className="admin-stat-icon" style={{ color: "var(--color-error)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <h3>{summary.lowStockProducts.length}</h3>
          <div className="admin-stat-footer">Sản phẩm cần nhập thêm tồn kho</div>
        </article>
      </div>

      <div className="admin-grid">
        <section className="panel">
          <h3>Đơn hàng theo trạng thái</h3>
          {summary.ordersByStatus.length === 0 ? (
            <p>Chưa có đơn hàng nào.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
              {summary.ordersByStatus.map((item) => (
                <div key={item.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--color-surface)", borderRadius: "var(--radius-sm)" }}>
                  <span className={getStatusPillClass(item.status)}>{item.status}</span>
                  <strong style={{ fontSize: "16px" }}>{item.count} đơn</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h3>Cảnh báo tồn kho</h3>
          {summary.lowStockProducts.length === 0 ? (
            <p>Tất cả sản phẩm đều đủ số lượng tồn kho.</p>
          ) : (
            <div className="admin-list" style={{ marginTop: "12px" }}>
              {summary.lowStockProducts.map((product) => (
                <Link to={`/admin/products/${product.id}/edit`} key={product.id} className="admin-row">
                  <div>
                    <strong style={{ color: "var(--color-text)" }}>{product.name}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "13px" }}>Còn lại: {product.stockQuantity} sản phẩm</p>
                  </div>
                  <span className="status-pill out-of-stock">Cần nhập hàng</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};
