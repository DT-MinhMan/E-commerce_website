import { Link, useSearchParams } from "react-router-dom";
import { useCreateCheckoutSession } from "../hooks/usePaymentQueries.js";

export const PaymentCancelView = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const checkoutSession = useCreateCheckoutSession();

  return (
    <div className="payment-confirmation-container">
      <section className="payment-status-card">
        <div className="payment-icon-wrapper warning">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div className="payment-status-header">
          <h2>Thanh toán đã bị hủy</h2>
          <p>Giao dịch của bạn đã bị hủy hoặc chưa hoàn tất. Bạn có thể thử thanh toán lại bất cứ lúc nào.</p>
        </div>

        {checkoutSession.error && (
          <div className="status-error" style={{ width: "100%" }}>
            {checkoutSession.error.message}
          </div>
        )}

        <div className="payment-action-group">
          {orderId ? (
            <>
              <button
                type="button"
                className="primary-action"
                disabled={checkoutSession.isPending}
                onClick={() => checkoutSession.mutate({ orderId })}
              >
                {checkoutSession.isPending ? "Đang kết nối Stripe..." : "Thử thanh toán lại"}
              </button>
              <Link className="secondary-action" to={`/orders/${orderId}`}>
                Xem chi tiết đơn hàng
              </Link>
            </>
          ) : (
            <Link className="primary-action" to="/orders">
              Quay lại danh sách đơn hàng
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

