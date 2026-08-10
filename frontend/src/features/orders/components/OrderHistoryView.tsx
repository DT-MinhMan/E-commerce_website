import { Link, useSearchParams } from "react-router-dom";
import { useOrdersQuery } from "../hooks/useOrderQueries.js";

const pageSize = 10;

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);

const parsePage = (value: string | null): number => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};

export const OrderHistoryView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePage(searchParams.get("page"));
  const ordersQuery = useOrdersQuery({ page, limit: pageSize });

  const setPage = (nextPage: number) => {
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {});
  };

  if (ordersQuery.isLoading) {
    return (
      <section className="panel">
        <p>Loading orders...</p>
      </section>
    );
  }

  if (ordersQuery.isError) {
    return (
      <section className="panel">
        <h2>Unable to load orders</h2>
        <p className="status-error">{ordersQuery.error.message}</p>
        <button type="button" className="primary-action" onClick={() => void ordersQuery.refetch()}>
          Retry
        </button>
      </section>
    );
  }

  const result = ordersQuery.data;

  if (!result || result.orders.length === 0) {
    return (
      <section className="panel">
        <h2>No orders yet</h2>
        <p>Your completed checkouts will appear here.</p>
        <Link className="primary-link" to="/products">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section className="orders-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Account</p>
          <h2>Orders</h2>
        </div>
      </div>

      <div className="order-list">
        {result.orders.map((order) => (
          <Link className="order-row" to={`/orders/${order.id}`} key={order.id}>
            <div>
              <h3>{order.orderNumber}</h3>
              <p>{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <span>{order.orderStatus}</span>
              <strong>{formatPrice(order.totalMinor, order.currency)}</strong>
            </div>
          </Link>
        ))}
      </div>

      <nav className="pagination" aria-label="Order pagination">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>
          Page {result.meta.page} of {Math.max(result.meta.totalPages, 1)}
        </span>
        <button type="button" disabled={page >= result.meta.totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </nav>
    </section>
  );
};
