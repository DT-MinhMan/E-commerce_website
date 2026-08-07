import { Link, useParams } from "react-router-dom";
import { useAdminOrderDetailQuery, useUpdateAdminOrderStatus } from "../../admin/hooks/useAdminQueries.js";
import type { OrderStatus } from "../../admin/types.js";

const statuses: { value: OrderStatus; label: string }[] = [
  { value: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "PROCESSING", label: "Đang xử lý" },
  { value: "SHIPPED", label: "Đang giao hàng" },
  { value: "COMPLETED", label: "Hoàn tất" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
  { value: "PAYMENT_REVIEW", label: "Kiểm tra thanh toán" }
];

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

export const AdminOrderDetailView = () => {
  const { orderId = "" } = useParams();
  const orderQuery = useAdminOrderDetailQuery(orderId);
  const updateStatus = useUpdateAdminOrderStatus(orderId);
  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return (
      <div className="panel admin-loading-panel">
        <div className="admin-spinner" />
        <p>Đang tải thông tin chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <section className="admin-page">
        <div className="panel admin-error-panel">
          <h2>Không thể tải thông tin đơn hàng</h2>
          {orderQuery.isError && <p className="status-error">{orderQuery.error.message}</p>}
          <Link className="admin-btn primary mt-16" to="/admin/orders">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link> / <Link to="/admin/orders">Đơn hàng</Link> / <span>{order.orderNumber}</span>
          </div>
          <h2>Chi tiết Đơn hàng #{order.orderNumber}</h2>
        </div>
        <Link className="admin-btn secondary" to="/admin/orders">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      <div className="admin-grid-2col">
        {/* Status Update Panel */}
        <div className="panel admin-form-card">
          <div className="card-header">
            <h3>Cập nhật Trạng thái</h3>
            <p>Thay đổi giai đoạn xử lý của đơn hàng trong quy trình bán hàng</p>
          </div>

          <div className="order-meta-summary">
            <div className="meta-item">
              <span className="meta-label">Trạng thái đơn:</span>
              <span className={getStatusPillClass(order.orderStatus)}>{translateStatus(order.orderStatus)}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Thanh toán:</span>
              <span className={`status-pill ${order.paymentStatus === "PAID" ? "paid" : "pending"}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          <div className="form-group mt-16">
            <label>Cập nhật trạng thái mới</label>
            <select
              value={order.orderStatus}
              disabled={updateStatus.isPending}
              onChange={(event) =>
                updateStatus.mutate({
                  nextStatus: event.target.value as OrderStatus,
                  expectedCurrentStatus: order.orderStatus as OrderStatus
                })
              }
            >
              {statuses.map((item) => (
                <option value={item.value} key={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {updateStatus.isPending && (
            <p className="field-hint text-amber mt-8">Đang gửi yêu cầu cập nhật trạng thái...</p>
          )}

          {updateStatus.error && <p className="status-error mt-12">{updateStatus.error.message}</p>}
        </div>

        {/* Order Items List Panel */}
        <div className="panel admin-form-card">
          <div className="card-header">
            <h3>Sản phẩm trong Đơn</h3>
            <p>Danh sách mặt hàng khách đã đặt trong đơn hàng này</p>
          </div>

          <div className="order-items-admin-list">
            {order.items.map((item) => (
              <div className="order-item-card" key={item.productId}>
                <div className="item-icon-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                </div>
                <div className="item-details">
                  <strong className="item-title">{item.productName}</strong>
                  <span className="item-qty-tag">Số lượng: <strong>{item.quantity}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

