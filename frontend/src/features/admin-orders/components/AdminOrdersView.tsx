import { Link } from "react-router-dom";
import { useAdminOrdersQuery } from "../../admin/hooks/useAdminQueries.js";

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
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đang giao hàng",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
    REFUNDED: "Đã hoàn tiền",
    PAYMENT_REVIEW: "Kiểm tra thanh toán"
  };
  return map[status] || status;
};

export const AdminOrdersView = () => {
  const ordersQuery = useAdminOrdersQuery({ page: 1, limit: 20 });
  const orders = ordersQuery.data?.orders ?? [];

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

      {ordersQuery.isLoading && (
        <div className="panel admin-loading-panel">
          <div className="admin-spinner" />
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      )}

      {ordersQuery.isError && (
        <div className="panel admin-error-panel">
          <p className="status-error">{ordersQuery.error.message}</p>
        </div>
      )}

      {ordersQuery.isSuccess && orders.length === 0 && (
        <div className="panel empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          </svg>
          <h3>Chưa phát sinh đơn hàng</h3>
          <p>Danh sách đơn đặt hàng từ khách hàng sẽ xuất hiện tại đây.</p>
        </div>
      )}

      {orders.length > 0 && (
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
                  </div>
                </div>

                <div>
                  <span className={getStatusPillClass(order.orderStatus)}>
                    {translateStatus(order.orderStatus)}
                  </span>
                </div>

                <div>
                  <span className={`status-pill ${order.paymentStatus === "PAID" ? "paid" : "pending"}`}>
                    {order.paymentStatus === "PAID" ? "Đã thanh toán" : order.paymentStatus}
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
      )}
    </section>
  );
};

