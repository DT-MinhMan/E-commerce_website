import { Link } from "react-router-dom";
import { useAdminCategoriesQuery } from "../../admin/hooks/useAdminQueries.js";

export const AdminCategoriesView = () => {
  const categoriesQuery = useAdminCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  return (
    <section className="admin-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link to="/admin">Admin</Link> / <span>Danh mục</span>
          </div>
          <h2>Quản lý Danh mục</h2>
          <p className="admin-header-desc">Tạo và quản lý danh mục sản phẩm đồ nội thất cửa hàng.</p>
        </div>
        <Link className="admin-btn primary" to="/admin/categories/new">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Thêm danh mục mới</span>
        </Link>
      </div>

      {categoriesQuery.isLoading && (
        <div className="panel admin-loading-panel">
          <div className="admin-spinner" />
          <p>Đang tải danh sách danh mục...</p>
        </div>
      )}

      {categoriesQuery.isError && (
        <div className="panel admin-error-panel">
          <p className="status-error">{categoriesQuery.error.message}</p>
        </div>
      )}

      {categoriesQuery.isSuccess && categories.length === 0 && (
        <div className="panel empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          </svg>
          <h3>Chưa có danh mục nào</h3>
          <p>Tạo danh mục đầu tiên để phân loại sản phẩm nội thất.</p>
        </div>
      )}

      {categories.length > 0 && (
        <div className="category-cards-grid">
          {categories.map((category) => (
            <div className="category-admin-card" key={category.id}>
              <div className="category-card-top">
                {category.imageUrl ? (
                  <div className="category-icon-box category-thumb">
                    <img src={category.imageUrl} alt={category.name} />
                  </div>
                ) : (
                  <div className="category-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </div>
                )}
                <span className={`status-pill ${category.status === "ACTIVE" ? "paid" : "cancelled"}`}>
                  {category.status === "ACTIVE" ? "Hoạt động" : "Ẩn"}
                </span>
              </div>

              <div className="category-card-body">
                <h3>{category.name}</h3>
                <code className="slug-tag">/{category.slug}</code>
                <p className="category-desc">{category.description || "Chưa có mô tả chi tiết cho danh mục này."}</p>
              </div>

              <div className="category-card-footer">
                <Link className="admin-btn-sm secondary full-width" to={`/admin/categories/${category.id}/edit`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Chỉnh sửa</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

