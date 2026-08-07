import { Link, useSearchParams } from "react-router-dom";
import { useAdminCategoriesQuery, useAdminProductsQuery } from "../../admin/hooks/useAdminQueries.js";
import type { AdminProductListParams } from "../../admin/types.js";
import { ROOM_TYPE_LABELS, type RoomType } from "../../catalog/types.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND"
  }).format(priceMinor / (currency === "VND" ? 1 : 100));

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
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link> / <span>Sản phẩm</span>
          </div>
          <h2>Quản lý Sản phẩm</h2>
          <p className="admin-header-desc">Quản lý danh sách sản phẩm, tồn kho, giá bán và thông tin chi tiết.</p>
        </div>
        <Link className="admin-btn primary" to="/admin/products/new">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Thêm sản phẩm mới</span>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-card">
        <div className="filter-item search-box">
          <label>Tìm kiếm sản phẩm</label>
          <div className="input-with-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={searchParams.get("q") ?? ""}
              onChange={(event) => update("q", event.target.value)}
              placeholder="Nhập tên sản phẩm..."
            />
          </div>
        </div>

        <div className="filter-item">
          <label>Danh mục</label>
          <select value={searchParams.get("category") ?? ""} onChange={(event) => update("category", event.target.value)}>
            <option value="">Tất cả danh mục</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-item">
          <label>Loại phòng</label>
          <select value={searchParams.get("roomType") ?? ""} onChange={(event) => update("roomType", event.target.value)}>
            <option value="">Tất cả loại phòng</option>
            {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((key) => (
              <option key={key} value={key}>
                {ROOM_TYPE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content States */}
      {productsQuery.isLoading && (
        <div className="panel admin-loading-panel">
          <div className="admin-spinner" />
          <p>Đang tải danh sách sản phẩm...</p>
        </div>
      )}

      {productsQuery.isError && (
        <div className="panel admin-error-panel">
          <p className="status-error">{productsQuery.error.message}</p>
        </div>
      )}

      {productsQuery.isSuccess && products.length === 0 && (
        <div className="panel empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <h3>Không tìm thấy sản phẩm phù hợp</h3>
          <p>Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc danh mục.</p>
        </div>
      )}

      {/* Product Grid Table */}
      {products.length > 0 && (
        <div className="admin-card-table">
          <div className="table-header-row">
            <span className="col-product">Sản phẩm</span>
            <span className="col-price">Giá bán</span>
            <span className="col-stock">Tồn kho</span>
            <span className="col-room">Loại phòng</span>
            <span className="col-status">Trạng thái</span>
            <span className="col-actions">Thao tác</span>
          </div>

          <div className="table-body">
            {products.map((product) => {
              const mainImage = product.images && product.images.length > 0 ? product.images[0]?.url : null;

              return (
                <div className="table-row-card" key={product.id}>
                  <div className="col-product product-cell">
                    <div className="product-thumb">
                      {mainImage ? (
                        <img src={mainImage} alt={product.name} />
                      ) : (
                        <div className="no-thumb-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="product-title-group">
                      <strong className="product-name-title">{product.name}</strong>
                      <span className="product-slug-sub">{product.slug}</span>
                    </div>
                  </div>

                  <div className="col-price">
                    <span className="price-tag">{formatPrice(product.priceMinor, product.currency)}</span>
                  </div>

                  <div className="col-stock">
                    {product.stockQuantity > 10 ? (
                      <span className="status-pill in-stock">{product.stockQuantity} sản phẩm</span>
                    ) : product.stockQuantity > 0 ? (
                      <span className="status-pill pending">Còn {product.stockQuantity} sp</span>
                    ) : (
                      <span className="status-pill out-of-stock">Hết hàng</span>
                    )}
                  </div>

                  <div className="col-room">
                    {product.roomType ? (
                      <span className="room-tag">{ROOM_TYPE_LABELS[product.roomType]}</span>
                    ) : (
                      <span className="text-muted-sm">--</span>
                    )}
                  </div>

                  <div className="col-status">
                    <span className={`status-pill ${product.status === "ACTIVE" ? "paid" : "cancelled"}`}>
                      {product.status === "ACTIVE" ? "Đang bán" : "Tạm ẩn"}
                    </span>
                  </div>

                  <div className="col-actions">
                    <Link className="admin-btn-sm secondary" to={`/admin/products/${product.id}/edit`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Sửa</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

