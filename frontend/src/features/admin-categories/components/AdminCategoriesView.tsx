import { Link } from "react-router-dom";
import { useAdminCategoriesQuery } from "../../admin/hooks/useAdminQueries.js";

export const AdminCategoriesView = () => {
  const categoriesQuery = useAdminCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  return (
    <section className="admin-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Categories</h2>
        </div>
        <Link className="primary-link" to="/admin/categories/new">
          New category
        </Link>
      </div>

      {categoriesQuery.isLoading && <section className="panel">Loading categories...</section>}
      {categoriesQuery.isError && <p className="status-error">{categoriesQuery.error.message}</p>}
      {categoriesQuery.isSuccess && categories.length === 0 && <section className="panel">No categories found.</section>}
      {categories.length > 0 && (
        <div className="admin-table">
          {categories.map((category) => (
            <article className="admin-row" key={category.id}>
              <div>
                <h3>{category.name}</h3>
                <p>
                  {category.slug} / {category.status}
                </p>
              </div>
              <div className="admin-row-actions">
                <Link className="secondary-action" to={`/admin/categories/${category.id}/edit`}>
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
