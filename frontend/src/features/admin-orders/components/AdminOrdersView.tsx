import { Link } from "react-router-dom";
import { useAdminOrdersQuery } from "../../admin/hooks/useAdminQueries.js";

export const AdminOrdersView = () => {
  const ordersQuery = useAdminOrdersQuery({ page: 1, limit: 20 });
  const orders = ordersQuery.data?.orders ?? [];

  return (
    <section className="admin-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Orders</h2>
        </div>
      </div>

      {ordersQuery.isLoading && <section className="panel">Loading orders...</section>}
      {ordersQuery.isError && <p className="status-error">{ordersQuery.error.message}</p>}
      {ordersQuery.isSuccess && orders.length === 0 && <section className="panel">No orders found.</section>}
      {orders.length > 0 && (
        <div className="admin-table">
          {orders.map((order) => (
            <article className="admin-row" key={order.id}>
              <div>
                <h3>{order.orderNumber}</h3>
                <p>
                  {order.orderStatus} / {order.paymentStatus}
                </p>
              </div>
              <div className="admin-row-actions">
                <Link className="secondary-action" to={`/admin/orders/${order.id}`}>
                  View
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
