import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCancelOrder, useOrderDetailQuery } from "../hooks/useOrderQueries.js";
import { useCreateCheckoutSession } from "../../payments/hooks/usePaymentQueries.js";
import {
  formatOrderDate,
  formatPrice,
  getOrderStatusColorClass,
  getPaymentStatusColorClass,
  isCancellableOrder,
  isPayableOrder,
  translateOrderStatus,
  translatePaymentMethod,
  translatePaymentStatus
} from "../orderUtils.js";

export const OrderDetailView = () => {
  const { orderId = "" } = useParams();
  const orderQuery = useOrderDetailQuery(orderId);
  const checkoutSession = useCreateCheckoutSession();
  const cancelOrderMutation = useCancelOrder();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState("");
  const [cancelErrorMsg, setCancelErrorMsg] = useState("");

  if (orderQuery.isLoading) {
    return (
      <section className="order-detail-page">
        <div className="panel">
          <p>Đang tải chi tiết đơn hàng...</p>
        </div>
      </section>
    );
  }

  if (orderQuery.isError) {
    return (
      <section className="order-detail-page">
        <div className="panel">
          <h2>{orderQuery.error.code === "ORDER_NOT_FOUND" ? "Không tìm thấy đơn hàng" : "Không thể tải đơn hàng"}</h2>
          <p className="status-error">{orderQuery.error.message}</p>
          <Link className="primary-link mt-16" to="/orders">
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </section>
    );
  }

  const order = orderQuery.data;

  if (!order) {
    return null;
  }

  const showPayBtn = isPayableOrder(order.orderStatus, order.paymentStatus, order.paymentMethod);
  const showCancelBtn = isCancellableOrder(order.orderStatus, order.paymentStatus);

  const handleCancelOrder = () => {
    setCancelErrorMsg("");
    setCancelSuccessMsg("");
    cancelOrderMutation.mutate(order.id, {
      onSuccess: () => {
        setShowCancelConfirm(false);
        setCancelSuccessMsg("Hủy đơn hàng thành công!");
      },
      onError: (err) => {
        setCancelErrorMsg(err.message || "Không thể hủy đơn hàng.");
      }
    });
  };

  return (
    <section className="order-detail-page">
      <div className="order-detail-header">
        <div>
          <span className="eyebrow">Chi tiết đơn hàng</span>
          <h2>#{order.orderNumber}</h2>
        </div>
        <div className="order-detail-actions">
          {showPayBtn && (
            <button
              type="button"
              className="primary-action pay-now-btn"
              disabled={checkoutSession.isPending}
              onClick={() => checkoutSession.mutate({ orderId: order.id })}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              <span>{checkoutSession.isPending ? "Đang mở Stripe..." : "Thanh toán ngay"}</span>
            </button>
          )}
          {showCancelBtn && (
            <button
              type="button"
              className="secondary-action danger-btn"
              onClick={() => {
                setCancelErrorMsg("");
                setShowCancelConfirm(true);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>Hủy đơn hàng</span>
            </button>
          )}
          <Link className="secondary-action" to="/orders">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Danh sách đơn hàng</span>
          </Link>
        </div>
      </div>
      {checkoutSession.error && <p className="status-error mt-12">{checkoutSession.error.message}</p>}
      {cancelSuccessMsg && <p className="status-success mt-12">{cancelSuccessMsg}</p>}
      {cancelErrorMsg && <p className="status-error mt-12">{cancelErrorMsg}</p>}

      {showCancelConfirm && (
        <div className="panel alert-panel mt-12">
          <p><strong>Xác nhận hủy đơn hàng:</strong> Bạn có chắc chắn muốn hủy đơn hàng #{order.orderNumber}? Hành động này không thể hoàn tác.</p>
          <div className="flex-gap-12 mt-12">
            <button
              type="button"
              className="primary-action danger-btn"
              disabled={cancelOrderMutation.isPending}
              onClick={handleCancelOrder}
            >
              {cancelOrderMutation.isPending ? "Đang hủy..." : "Xác nhận hủy đơn"}
            </button>
            <button
              type="button"
              className="secondary-action"
              disabled={cancelOrderMutation.isPending}
              onClick={() => setShowCancelConfirm(false)}
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}


      <div className="checkout-grid">
        <div className="order-list">
          {order.items.map((item) => (
            <article className="cart-item" key={item.productId}>
              <div className="cart-item-media">
                {item.productImage ? <img src={item.productImage.url} alt={item.productName} /> : <span>Chưa có ảnh</span>}
              </div>
              <div className="cart-item-body">
                <h3>
                  <Link to={`/products/${item.productSlug}`}>{item.productName}</Link>
                </h3>
                <p>
                  {formatPrice(item.unitPriceMinor, order.currency)} × {item.quantity}
                </p>
              </div>
              <p className="cart-line-total">{formatPrice(item.lineTotalMinor, order.currency)}</p>
            </article>
          ))}
        </div>

        <aside className="order-summary panel">
          {/* Trạng thái & Thời gian */}
          <div className="order-info-section">
            <h3 className="order-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Trạng thái & Thời gian</span>
            </h3>

            <div className="order-status-list">
              <div className="order-status-row">
                <span className="order-status-label">Trạng thái đơn</span>
                <span className={`order-badge ${getOrderStatusColorClass(order.orderStatus)}`}>
                  {translateOrderStatus(order.orderStatus)}
                </span>
              </div>

              <div className="order-status-row">
                <span className="order-status-label">Thanh toán</span>
                <span className={`order-badge ${getPaymentStatusColorClass(order.paymentStatus)}`}>
                  {translatePaymentStatus(order.paymentStatus)}
                </span>
              </div>

              <div className="order-status-row">
                <span className="order-status-label">Phương thức</span>
                <span className="order-status-value">{translatePaymentMethod(order.paymentMethod)}</span>
              </div>

              <div className="order-status-row">
                <span className="order-status-label">Ngày đặt hàng</span>
                <span className="order-status-value">{formatOrderDate(order.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Địa chỉ nhận hàng */}
          <div className="order-info-section">
            <h3 className="order-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>Địa chỉ nhận hàng</span>
            </h3>

            <div className="shipping-address-card">
              <div className="address-recipient">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <strong>{order.shippingAddress.recipientName}</strong>
              </div>

              <div className="address-phone">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{order.shippingAddress.phone}</span>
              </div>

              <div className="address-location">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <div>
                  <p className="address-line">{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p className="address-line">{order.shippingAddress.addressLine2}</p>}
                  <p className="address-sub">
                    {[order.shippingAddress.city, order.shippingAddress.stateOrProvince, order.shippingAddress.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  <p className="address-country">{order.shippingAddress.countryCode}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tổng tiền */}
          <div className="summary-lines">
            <div>
              <span>Tạm tính</span>
              <strong>{formatPrice(order.subtotalMinor, order.currency)}</strong>
            </div>
            <div>
              <span>Phí giao hàng</span>
              <strong>{formatPrice(order.shippingFeeMinor, order.currency)}</strong>
            </div>
            <div className="summary-total">
              <span>Tổng thanh toán</span>
              <strong>{formatPrice(order.totalMinor, order.currency)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
