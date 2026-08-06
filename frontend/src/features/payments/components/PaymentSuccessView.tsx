import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isPaymentPollingTerminal, usePaymentStatusByOrderQuery } from "../hooks/usePaymentQueries.js";

const pollingTimeoutMs = 60_000;

export const PaymentSuccessView = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const [timedOut, setTimedOut] = useState(false);
  const paymentQuery = usePaymentStatusByOrderQuery(orderId, { poll: true, timedOut });
  const paymentStatus = paymentQuery.data;
  const isTerminal = paymentStatus ? isPaymentPollingTerminal(paymentStatus) : false;

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
      <section className="panel">
        <h2>Missing order</h2>
        <p className="status-error">The payment confirmation link is missing an order id.</p>
        <Link className="primary-link" to="/orders">
          Back to orders
        </Link>
      </section>
    );
  }

  return (
    <section className="payment-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Stripe Checkout</p>
          <h2>Payment confirmation</h2>
        </div>
        <Link className="secondary-action" to={`/orders/${orderId}`}>
          Order details
        </Link>
      </div>

      <section className="panel payment-panel">
        {paymentQuery.isLoading ? <p>Confirming payment...</p> : null}
        {paymentQuery.isError ? <p className="status-error">{paymentQuery.error.message}</p> : null}
        {paymentStatus ? (
          <dl className="health-list">
            <div>
              <dt>Order</dt>
              <dd>{paymentStatus.order.orderStatus}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{paymentStatus.payment.status}</dd>
            </div>
            <div>
              <dt>Paid at</dt>
              <dd>{paymentStatus.order.paidAt ? new Date(paymentStatus.order.paidAt).toLocaleString() : "Waiting for webhook"}</dd>
            </div>
          </dl>
        ) : null}
        {!isTerminal && !timedOut && !paymentQuery.isError ? <p>Waiting for Stripe webhook confirmation...</p> : null}
        {timedOut && !isTerminal ? <p className="status-error">Confirmation is taking longer than expected.</p> : null}
        <button type="button" className="secondary-action" onClick={() => void paymentQuery.refetch()}>
          Refresh status
        </button>
      </section>
    </section>
  );
};
