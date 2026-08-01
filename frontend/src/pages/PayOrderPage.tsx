import { Link, useParams } from "react-router-dom";
import { useOrderDetailQuery } from "../hooks/useOrderQueries.js";
import { useCreateCheckoutSession, usePaymentStatusByOrderQuery } from "../hooks/usePaymentQueries.js";

const payableOrderStatuses = new Set(["PENDING_PAYMENT"]);
const payablePaymentStatuses = new Set(["PENDING", "FAILED"]);

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);

export const PayOrderPage = () => {
  const { orderId = "" } = useParams();
  const orderQuery = useOrderDetailQuery(orderId);
  const paymentQuery = usePaymentStatusByOrderQuery(orderId);
  const checkoutSession = useCreateCheckoutSession();
  const order = orderQuery.data;
  const paymentStatus = paymentQuery.data;
  const canPay =
    Boolean(order) &&
    payableOrderStatuses.has(order?.orderStatus ?? "") &&
    payablePaymentStatuses.has(paymentStatus?.payment.status ?? order?.paymentStatus ?? "");

  if (orderQuery.isLoading) {
    return (
      <section className="panel">
        <p>Loading payment...</p>
      </section>
    );
  }

  if (orderQuery.isError) {
    return (
      <section className="panel">
        <h2>{orderQuery.error.code === "ORDER_NOT_FOUND" ? "Order not found" : "Unable to load order"}</h2>
        <p className="status-error">{orderQuery.error.message}</p>
        <Link className="primary-link" to="/orders">
          Back to orders
        </Link>
      </section>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <section className="payment-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Payment</p>
          <h2>{order.orderNumber}</h2>
        </div>
        <Link className="secondary-action" to={`/orders/${order.id}`}>
          Order details
        </Link>
      </div>

      <section className="panel payment-panel">
        <dl className="health-list">
          <div>
            <dt>Total</dt>
            <dd>{formatPrice(order.totalMinor, order.currency)}</dd>
          </div>
          <div>
            <dt>Order</dt>
            <dd>{order.orderStatus}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{paymentStatus?.payment.status ?? order.paymentStatus}</dd>
          </div>
        </dl>

        {paymentQuery.isError ? <p className="status-error">{paymentQuery.error.message}</p> : null}
        {checkoutSession.error ? <p className="status-error">{checkoutSession.error.message}</p> : null}
        {!canPay ? <p className="status-error">This order is not payable.</p> : null}

        <button
          className="primary-action"
          disabled={!canPay || checkoutSession.isPending}
          type="button"
          onClick={() => checkoutSession.mutate({ orderId: order.id })}
        >
          {checkoutSession.isPending ? "Opening Stripe..." : "Pay with Stripe"}
        </button>
      </section>
    </section>
  );
};
