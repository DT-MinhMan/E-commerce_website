import { Link, useSearchParams } from "react-router-dom";
import { useAdminCategoriesQuery, useAdminProductsQuery } from "../../admin/hooks/useAdminQueries.js";
import type { AdminProductListParams } from "../../admin/types.js";
import { ROOM_TYPE_LABELS, type RoomType } from "../../catalog/types.js";

const paramsFromSearch = (searchParams: URLSearchParams): AdminProductListParams => ({
  page: Number(searchParams.get("page") ?? 1),
  limit: 20,
  sort: "newest",
  ...(searchParams.get("q") ? { q: searchParams.get("q") ?? undefined } : {}),
  ...(searchParams.get("category") ? { category: searchParams.get("category") ?? undefined } : {}),
  ...(searchParams.get("roomType") ? { roomType: (searchParams.get("roomType") as RoomType) ?? undefined } : {})
});

export const AdminProductsView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productsQuery = useAdminProductsQuery(paramsFromSearch(searchParams));
  const categoriesQuery = useAdminCategoriesQuery();
  const products = productsQuery.data?.products ?? [];

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  };

  return (
    <section className="admin-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Products</h2>
        </div>
        <Link className="primary-link" to="/admin/products/new">
          New product
        </Link>
      </div>

      <div className="catalog-filters admin-filters">
        <label>
          Search
          <input value={searchParams.get("q") ?? ""} onChange={(event) => update("q", event.target.value)} placeholder="Product name" />
        </label>
        <label>
          Category
          <select value={searchParams.get("category") ?? ""} onChange={(event) => update("category", event.target.value)}>
            <option value="">All categories</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Phòng
          <select value={searchParams.get("roomType") ?? ""} onChange={(event) => update("roomType", event.target.value)}>
            <option value="">Tất cả loại phòng</option>
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((key) => (
              <option key={key} value={key}>
                {ROOM_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {productsQuery.isLoading && <section className="panel">Loading products...</section>}
      {productsQuery.isError && <p className="status-error">{productsQuery.error.message}</p>}
      {productsQuery.isSuccess && products.length === 0 && <section className="panel">No products found.</section>}
      {products.length > 0 && (
        <div className="admin-table">
          {products.map((product) => (
            <article className="admin-row" key={product.id}>
              <div>
                <h3>{product.name}</h3>
                <p>
                  {product.status} / {product.stockQuantity} in stock
                  {product.roomType && ` • ${ROOM_TYPE_LABELS[product.roomType]}`}
                </p>
              </div>
              <div className="admin-row-actions">
                <Link className="secondary-action" to={`/admin/products/${product.id}/edit`}>
                  Edit
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
