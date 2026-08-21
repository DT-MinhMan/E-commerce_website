import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCancelOrder, useOrdersQuery } from "../hooks/useOrderQueries.js";
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

const pageSize = 10;

const parsePage = (value: string | null): number => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const OrderHistoryView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const ordersQuery = useOrdersQuery({ page, limit: pageSize });
  const checkoutSession = useCreateCheckoutSession();
  const cancelOrderMutation = useCancelOrder();

  const [confirmCancelOrderId, setConfirmCancelOrderId] = useState<string | null>(null);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [cancelErrorMsg, setCancelErrorMsg] = useState<string | null>(null);

  const setPage = (nextPage: number) => {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {});
  };

  const handleCancelOrder = (orderId: string) => {
    setCancelErrorMsg(null);
    setCancelSuccessMsg(null);
    cancelOrderMutation.mutate(orderId, {
      onSuccess: () => {
        setConfirmCancelOrderId(null);
        setCancelSuccessMsg("Hủy đơn hàng thành công!");
      },
      onError: (err) => {
        setCancelErrorMsg(err.message || "Không thể hủy đơn hàng.");
      }
    });
  };

  if (ordersQuery.isLoading) {
    return (
      <section className="orders-page">
        <div className="catalog-header">
          <div>
            <p className="eyebrow">Tài khoản</p>
            <h2>Đơn hàng của tôi</h2>
          </div>
        </div>
        <div className="orders-loading-skeleton">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </section>
    );
  }

  if (ordersQuery.isError) {
    return (
      <section className="orders-page">
        <div className="panel order-error-panel">
          <h2>Không thể tải danh sách đơn hàng</h2>
          <p className="status-error">{ordersQuery.error.message}</p>
          <button type="button" className="primary-action mt-16" onClick={() => void ordersQuery.refetch()}>
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  const result = ordersQuery.data;

  if (!result || result.orders.length === 0) {
    return (
      <section className="orders-page">
        <div className="catalog-header">
          <div>
            <p className="eyebrow">Tài khoản</p>
            <h2>Đơn hàng của tôi</h2>
          </div>
        </div>
        <div className="panel order-empty-panel">
          <div className="empty-icon-box">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1" />
              <path d="M18 8h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-4" />
              <circle cx="8" cy="12" r="2" />
            </svg>
          </div>
          <h3>Chưa có đơn hàng nào</h3>
          <p>Các đơn hàng bạn đã mua sẽ xuất hiện tại đây.</p>
          <Link className="primary-action mt-16" to="/products">
            Khám phá sản phẩm
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Tài khoản</p>
          <h2>Đơn hàng của tôi</h2>
        </div>
      </div>

      {cancelSuccessMsg && <p className="status-success mb-16">{cancelSuccessMsg}</p>}
      {cancelErrorMsg && <p className="status-error mb-16">{cancelErrorMsg}</p>}

      <div className="user-orders-list">
        {result.orders.map((order) => {
          const visibleItems = order.items.slice(0, 2);
          const remainingCount = order.items.length - visibleItems.length;
          const showPayBtn = isPayableOrder(order.orderStatus, order.paymentStatus, order.paymentMethod);
          const showCancelBtn = isCancellableOrder(order.orderStatus, order.paymentStatus);
          const isConfirming = confirmCancelOrderId === order.id;

          return (
            <article className="user-order-card" key={order.id}>
              {/* Header */}
              <header className="order-card-header">
                <div className="order-card-identity">
                  <span className="order-number">Đơn hàng #{order.orderNumber}</span>
                  <span className="order-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatOrderDate(order.createdAt)}
                  </span>
                </div>
                <div className="order-card-status">
                  <span className={`order-badge ${getOrderStatusColorClass(order.orderStatus)}`}>
                    {translateOrderStatus(order.orderStatus)}
                  </span>
                </div>
              </header>

              {/* Body / Items Preview */}
              <div className="order-card-body">
                {visibleItems.map((item) => (
                  <div className="order-item-preview" key={item.productId}>
                    <div className="item-preview-media">
                      {item.productImage?.url ? (
                        <img src={item.productImage.url} alt={item.productName} />
                      ) : (
                        <div className="item-placeholder-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="item-preview-info">
                      <h4 className="item-preview-title">{item.productName}</h4>
                      <p className="item-preview-qty">
                        {formatPrice(item.unitPriceMinor, order.currency)} × {item.quantity}
                      </p>
                    </div>
                    <div className="item-preview-total">
                      {formatPrice(item.lineTotalMinor, order.currency)}
                    </div>
                  </div>
                ))}

                {remainingCount > 0 && (
                  <div className="order-more-items">
                    <span>+ {remainingCount} sản phẩm khác trong đơn hàng</span>
                  </div>
                )}

                {isConfirming && (
                  <div className="panel alert-panel mt-12 mb-12">
                    <p><strong>Xác nhận hủy đơn hàng:</strong> Bạn có chắc chắn muốn hủy đơn hàng #{order.orderNumber}?</p>
                    <div className="flex-gap-12 mt-12">
                      <button
                        type="button"
                        className="btn-order-action danger"
                        disabled={cancelOrderMutation.isPending}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        {cancelOrderMutation.isPending ? "Đang hủy..." : "Xác nhận hủy"}
                      </button>
                      <button
                        type="button"
                        className="btn-order-action secondary"
                        disabled={cancelOrderMutation.isPending}
                        onClick={() => setConfirmCancelOrderId(null)}
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <footer className="order-card-footer">
                <div className="order-payment-meta">
                  <span className="meta-label">Thanh toán:</span>
                  <span className={`order-badge order-badge--sm ${getPaymentStatusColorClass(order.paymentStatus)}`}>
                    {translatePaymentStatus(order.paymentStatus)}
                  </span>
                  <span className="meta-label" style={{ marginLeft: 8 }}>Phương thức:</span>
                  <span className="order-badge order-badge--sm order-badge--neutral">
                    {translatePaymentMethod(order.paymentMethod)}
                  </span>
                </div>

                <div className="order-actions-wrap">
                  <div className="order-total-box">
                    <span className="total-label">Tổng tiền:</span>
                    <strong className="total-amount">{formatPrice(order.totalMinor, order.currency)}</strong>
                  </div>

                  <div className="order-btn-group">
                    <Link className="btn-order-action secondary" to={`/orders/${order.id}`}>
                      Chi tiết
                    </Link>
                    {showCancelBtn && !isConfirming && (
                      <button
                        type="button"
                        className="btn-order-action secondary danger"
                        onClick={() => {
                          setCancelErrorMsg(null);
                          setCancelSuccessMsg(null);
                          setConfirmCancelOrderId(order.id);
                        }}
                      >
                        Hủy đơn
                      </button>
                    )}
                    {showPayBtn && (
                      <button
                        type="button"
                        className="btn-order-action primary"
                        disabled={checkoutSession.isPending && checkoutSession.variables?.orderId === order.id}
                        onClick={() => checkoutSession.mutate({ orderId: order.id })}
                      >
                        {checkoutSession.isPending && checkoutSession.variables?.orderId === order.id
                          ? "Đang mở Stripe..."
                          : "Thanh toán ngay"}
                      </button>
                    )}
                  </div>
                </div>
              </footer>
            </article>
          );
        })}
      </div>


      {result.meta.totalPages > 1 && (
        <nav className="pagination mt-24" aria-label="Order pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span>
            Trang {result.meta.page} / {result.meta.totalPages}
          </span>
          <button type="button" disabled={page >= result.meta.totalPages} onClick={() => setPage(page + 1)}>
            Trang sau
          </button>
        </nav>
      )}
    </section>
  );
};
