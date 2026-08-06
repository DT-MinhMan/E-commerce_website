import { Link, useParams } from "react-router-dom";
import { useOrderDetailQuery } from "../hooks/useOrderQueries.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);

export const OrderDetailView = () => {
  const { orderId = "" } = useParams();
  const orderQuery = useOrderDetailQuery(orderId);

  if (orderQuery.isLoading) {
    return (
      <section className="panel">
        <p>Loading order...</p>
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

  const order = orderQuery.data;

  if (!order) {
    return null;
  }

  return (
    <section className="order-detail-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Order</p>
          <h2>{order.orderNumber}</h2>
        </div>
        <div className="payment-actions">
          {order.orderStatus === "PENDING_PAYMENT" && (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED") ? (
            <Link className="primary-link" to={`/orders/${order.id}/pay`}>
              Pay
            </Link>
          ) : null}
          <Link className="secondary-action" to="/orders">
            All orders
          </Link>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="order-list">
          {order.items.map((item) => (
            <article className="cart-item" key={item.productId}>
              <div className="cart-item-media">
                {item.productImage ? <img src={item.productImage.url} alt={item.productName} /> : <span>No image</span>}
              </div>
              <div className="cart-item-body">
                <h3>
                  <Link to={`/products/${item.productSlug}`}>{item.productName}</Link>
                </h3>
                <p>
                  {formatPrice(item.unitPriceMinor, order.currency)} x {item.quantity}
                </p>
              </div>
              <p className="cart-line-total">{formatPrice(item.lineTotalMinor, order.currency)}</p>
            </article>
          ))}
        </div>

        <aside className="order-summary panel">
          <h3>Status</h3>
          <dl className="health-list">
            <div>
              <dt>Order</dt>
              <dd>{order.orderStatus}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{order.paymentStatus}</dd>
            </div>
            <div>
              <dt>Placed</dt>
              <dd>{new Date(order.createdAt).toLocaleString()}</dd>
            </div>
          </dl>
          <h3>Shipping</h3>
          <p>
            {order.shippingAddress.recipientName}
            <br />
            {order.shippingAddress.addressLine1}
            {order.shippingAddress.addressLine2 ? (
              <>
                <br />
                {order.shippingAddress.addressLine2}
              </>
            ) : null}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.stateOrProvince} {order.shippingAddress.postalCode}
            <br />
            {order.shippingAddress.countryCode}
          </p>
          <div className="summary-lines">
            <div>
              <span>Subtotal</span>
              <strong>{formatPrice(order.subtotalMinor, order.currency)}</strong>
            </div>
            <div>
              <span>Shipping</span>
              <strong>{formatPrice(order.shippingFeeMinor, order.currency)}</strong>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <strong>{formatPrice(order.totalMinor, order.currency)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};
