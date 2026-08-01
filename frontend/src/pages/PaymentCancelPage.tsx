import { Link, useSearchParams } from "react-router-dom";

export const PaymentCancelPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";

  return (
    <section className="payment-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Stripe Checkout</p>
          <h2>Payment canceled</h2>
        </div>
      </div>

      <section className="panel payment-panel">
        <p>Your order has not been marked as paid. You can retry payment while the order remains payable.</p>
        {orderId ? (
          <div className="payment-actions">
            <Link className="primary-link" to={`/orders/${orderId}/pay`}>
              Pay again
            </Link>
            <Link className="secondary-action" to={`/orders/${orderId}`}>
              Order details
            </Link>
          </div>
        ) : (
          <Link className="primary-link" to="/orders">
            Back to orders
          </Link>
        )}
      </section>
    </section>
  );
};
