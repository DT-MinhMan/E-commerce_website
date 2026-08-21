import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isPaymentPollingTerminal, usePaymentStatusByOrderQuery } from "../hooks/usePaymentQueries.js";
import { useOrderDetailQuery } from "../../orders/hooks/useOrderQueries.js";

const pollingTimeoutMs = 60_000;

const formatPrice = (priceMinor?: number, currency?: string): string => {
  if (priceMinor === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(priceMinor / 100);
};

const successStatuses = new Set(["SUCCEEDED", "PAID", "COMPLETED", "PROCESSING"]);

export const PaymentSuccessView = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const [timedOut, setTimedOut] = useState(false);
  const paymentQuery = usePaymentStatusByOrderQuery(orderId, { poll: true, timedOut });
  const orderQuery = useOrderDetailQuery(orderId);

  const paymentStatus = paymentQuery.data;
  const order = orderQuery.data;
  const isTerminal = paymentStatus ? isPaymentPollingTerminal(paymentStatus) : false;

  const isSuccess =
    successStatuses.has(paymentStatus?.payment.status ?? "") ||
    successStatuses.has(paymentStatus?.order.paymentStatus ?? "") ||
    successStatuses.has(paymentStatus?.order.orderStatus ?? "") ||
    successStatuses.has(order?.paymentStatus ?? "") ||
    successStatuses.has(order?.orderStatus ?? "");

  const isFailed =
    paymentStatus?.payment.status === "FAILED" ||
    paymentStatus?.order.paymentStatus === "FAILED" ||
    order?.paymentStatus === "FAILED";

  const isReview = paymentStatus?.order.orderStatus === "PAYMENT_REVIEW" || order?.orderStatus === "PAYMENT_REVIEW";
  const isProcessing = !isSuccess && !isFailed && !isReview && !timedOut && !paymentQuery.isError;


  useEffect(() => {
    setTimedOut(false);
    if (!orderId || isTerminal) {
      return;
    }

    const timeout = window.setTimeout(() => setTimedOut(true), pollingTimeoutMs);
    return () => window.clearTimeout(timeout);
  }, [orderId, isTerminal]);

  if (!orderId) {
    return (
      <div className="payment-confirmation-container">
        <section className="payment-status-card">
          <div className="payment-icon-wrapper error">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="payment-status-header">
            <h2>Không tìm thấy đơn hàng</h2>
            <p>Liên kết xác nhận thanh toán thiếu thông tin mã đơn hàng.</p>
          </div>
          <Link className="primary-action" to="/orders">
            Quay lại danh sách đơn hàng
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="payment-confirmation-container">
      <section className="payment-status-card">
        {/* Banner Icon */}
        {isSuccess ? (
          <div className="payment-icon-wrapper success">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
        ) : isProcessing ? (
          <div className="payment-icon-wrapper processing">
            <div className="payment-spinner" />
          </div>
        ) : isFailed ? (
          <div className="payment-icon-wrapper error">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        ) : (
          <div className="payment-icon-wrapper warning">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        )}

        {/* Header Text */}
        <div className="payment-status-header">
          {isSuccess ? (
            <>
              <h2>Cảm ơn bạn đã đặt hàng!</h2>
              <p>Thanh toán của bạn đã được xác nhận thành công. Đơn hàng đang được hệ thống xử lý.</p>
            </>
          ) : isProcessing ? (
            <>
              <h2>Đang xác thực thanh toán...</h2>
              <p>Hệ thống đang kiểm tra phản hồi từ Stripe. Quá trình này thường chỉ mất vài giây.</p>
            </>
          ) : isFailed ? (
            <>
              <h2>Thanh toán chưa hoàn tất</h2>
              <p>Giao dịch của bạn bị gián đoạn hoặc không thành công. Vui lòng kiểm tra lại đơn hàng.</p>
            </>
          ) : isReview ? (
            <>
              <h2>Đơn hàng cần kiểm duyệt</h2>
              <p>Thanh toán đã được ghi nhận nhưng cần nhân viên kiểm tra lại thông tin tồn kho.</p>
            </>
          ) : (
            <>
              <h2>Xác thực mất nhiều thời gian hơn dự kiến</h2>
              <p>Vui lòng bấm nút làm mới trạng thái bên dưới để kiểm tra lại.</p>
            </>
          )}
        </div>

        {paymentQuery.isError && (
          <div className="status-error" style={{ width: "100%" }}>
            {paymentQuery.error.message}
          </div>
        )}

        {/* Details Box */}
        <div className="payment-details-box">
          <h3>Chi tiết giao dịch</h3>
          <div className="payment-detail-row">
            <span className="label">Mã đơn hàng:</span>
            <span className="value">{order?.orderNumber || orderId}</span>
          </div>

          <div className="payment-detail-row">
            <span className="label">Tổng tiền:</span>
            <span className="value">
              {formatPrice(
                order?.totalMinor ?? paymentStatus?.payment.amountMinor,
                order?.currency ?? paymentStatus?.payment.currency
              )}
            </span>
          </div>

          <div className="payment-detail-row">
            <span className="label">Phương thức:</span>
            <span className="value">Stripe Checkout</span>
          </div>

          <div className="payment-detail-row">
            <span className="label">Trạng thái thanh toán:</span>
            <span className="value">
              {isSuccess ? (
                <span className="payment-badge-pill success">Đã thanh toán</span>
              ) : isProcessing ? (
                <span className="payment-badge-pill processing">Đang xác thực</span>
              ) : isFailed ? (
                <span className="payment-badge-pill error">Thất bại</span>
              ) : (
                <span className="payment-badge-pill warning">{paymentStatus?.payment.status || "Chờ xử lý"}</span>
              )}
            </span>
          </div>

          {(paymentStatus?.payment.paidAt || order?.paidAt) && (
            <div className="payment-detail-row">
              <span className="label">Thời gian:</span>
              <span className="value">
                {new Date(paymentStatus?.payment.paidAt || order?.paidAt || "").toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Group */}
        <div className="payment-action-group">
          <Link className="primary-action" to={`/orders/${orderId}`}>
            Xem chi tiết đơn hàng
          </Link>

          <Link className="secondary-action" to="/products">
            Tiếp tục mua sắm
          </Link>

          {!isTerminal && (
            <button
              type="button"
              className="secondary-action"
              onClick={() => {
                void paymentQuery.refetch();
                void orderQuery.refetch();
              }}
            >
              Làm mới trạng thái
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

