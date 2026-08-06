import { Link, useParams } from "react-router-dom";
import { useAdminOrderDetailQuery, useUpdateAdminOrderStatus } from "../../admin/hooks/useAdminQueries.js";
import type { OrderStatus } from "../../admin/types.js";

const statuses: OrderStatus[] = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "REFUNDED", "PAYMENT_REVIEW"];

export const AdminOrderDetailView = () => {
  const { orderId = "" } = useParams();
  const orderQuery = useAdminOrderDetailQuery(orderId);
  const updateStatus = useUpdateAdminOrderStatus(orderId);
  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return <section className="panel">Loading order...</section>;
  }

  if (orderQuery.isError || !order) {
    return (
      <section className="panel">
        <h2>Unable to load order</h2>
        {orderQuery.isError && <p className="status-error">{orderQuery.error.message}</p>}
        <Link className="primary-link" to="/admin/orders">
          Back to orders
        </Link>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>{order.orderNumber}</h2>
        </div>
        <Link className="secondary-action" to="/admin/orders">
          Back to orders
        </Link>
      </div>

      <section className="admin-form panel">
        <p>Status: {order.orderStatus}</p>
        <p>Payment: {order.paymentStatus}</p>
        <label>
          Update status
          <select
            value={order.orderStatus}
            disabled={updateStatus.isPending}
            onChange={(event) =>
              updateStatus.mutate({ nextStatus: event.target.value as OrderStatus, expectedCurrentStatus: order.orderStatus as OrderStatus })
            }
          >
            {statuses.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        {updateStatus.error && <p className="status-error">{updateStatus.error.message}</p>}
      </section>

      <div className="admin-table">
        {order.items.map((item) => (
          <article className="admin-row" key={item.productId}>
            <div>
              <h3>{item.productName}</h3>
              <p>Quantity: {item.quantity}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
