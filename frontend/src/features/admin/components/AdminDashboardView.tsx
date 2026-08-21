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

export const AdminDashboardView = () => {
  const summaryQuery = useAdminDashboardSummaryQuery();

  if (summaryQuery.isLoading) {
    return (
      <section className="panel admin-loading-panel">
        <div className="admin-spinner" />
        <p>Đang tải dữ liệu bảng điều khiển quản trị...</p>
      </section>
    );
  }

  if (summaryQuery.isError) {
    return (
      <section className="panel admin-error-panel">
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
      {/* Top Banner / Dashboard Header */}
      <div className="admin-dashboard-hero">
        <div className="admin-hero-text">
          <span className="admin-hero-eyebrow">ZenLiving Admin Portal</span>
          <h2>Tổng quan Hệ thống</h2>
          <p>Theo dõi chỉ số kinh doanh, đơn hàng phát sinh và cảnh báo tồn kho thời gian thực.</p>
        </div>
      </div>

      {/* Key Metric Stats Grid */}
      <div className="admin-stats">
        <article className="admin-stat-card stat-revenue">
          <div className="admin-stat-header">
            <span>Doanh thu đã nhận</span>
            <div className="admin-stat-icon icon-emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <h3 className="stat-value">{formatPrice(summary.paidRevenueMinor, summary.currency)}</h3>
          <div className="admin-stat-footer">
            <span className="stat-trend positive">● Thực nhận</span> từ các đơn hàng đã hoàn tất thanh toán
          </div>
        </article>

        <article className="admin-stat-card stat-orders">
          <div className="admin-stat-header">
            <span>Tổng đơn hàng</span>
            <div className="admin-stat-icon icon-amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
          </div>
          <h3 className="stat-value">{summary.totalOrders} <span className="stat-unit">đơn</span></h3>
          <div className="admin-stat-footer">
            Tổng số đơn đặt hàng phát sinh trong hệ thống
          </div>
        </article>

        <article className="admin-stat-card stat-stock">
          <div className="admin-stat-header">
            <span>Cảnh báo tồn kho</span>
            <div className="admin-stat-icon icon-rose">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
          </div>
          <h3 className="stat-value text-rose">{summary.lowStockProducts.length} <span className="stat-unit">mặt hàng</span></h3>
          <div className="admin-stat-footer">
            Sản phẩm cần xem xét bổ sung nguồn hàng
          </div>
        </article>
      </div>

      {/* Main Grid Panels */}
      <div className="admin-grid-2col">
        {/* Order Status Summary Panel */}
        <section className="panel admin-dashboard-panel">
          <div className="panel-title-bar">
            <div>
              <h3>Đơn hàng theo Trạng thái</h3>
              <p className="panel-subtitle">Phân bổ số lượng đơn hàng theo từng giai đoạn xử lý</p>
            </div>
            <Link to="/admin/orders" className="panel-link">
              Xem tất cả đơn
            </Link>
          </div>

          {summary.ordersByStatus.length === 0 ? (
            <div className="empty-state">
              <p>Chưa phát sinh đơn hàng nào.</p>
            </div>
          ) : (
            <div className="status-breakdown-list">
              {summary.ordersByStatus.map((item) => (
                <div key={item.status} className="status-breakdown-item">
                  <div className="status-info">
                    <span className={getStatusPillClass(item.status)}>
                      {translateStatus(item.status)}
                    </span>
                  </div>
                  <div className="status-count-badge">
                    <strong>{item.count}</strong> đơn hàng
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Low Stock Warning Panel */}
        <section className="panel admin-dashboard-panel">
          <div className="panel-title-bar">
            <div>
              <h3>Cảnh báo Tồn kho</h3>
              <p className="panel-subtitle">Danh sách sản phẩm sắp hết hàng cần nhập bù</p>
            </div>
            <Link to="/admin/products" className="panel-link">
              Quản lý sản phẩm
            </Link>
          </div>

          {summary.lowStockProducts.length === 0 ? (
            <div className="empty-state success-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "#10b981" }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>Tất cả sản phẩm hiện tại đều đáp ứng đủ số lượng tồn kho.</p>
            </div>
          ) : (
            <div className="low-stock-list">
              {summary.lowStockProducts.map((product) => (
                <div key={product.id} className="low-stock-item">
                  <div className="product-info-mini">
                    <div className="product-icon-box">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    </div>
                    <div>
                      <strong className="product-name">{product.name}</strong>
                      <p className="stock-count text-rose">Còn lại: <strong>{product.stockQuantity}</strong> sản phẩm</p>
                    </div>
                  </div>
                  <Link to={`/admin/products/${product.id}/edit`} className="admin-btn-sm warning">
                    Nhập hàng
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

