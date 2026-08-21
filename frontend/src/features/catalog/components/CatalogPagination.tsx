import type { PaginationMeta, ProductListParams } from "../types.js";

interface CatalogPaginationProps {
  meta: PaginationMeta;
  params: ProductListParams;
  onUpdateFilters: (updates: Record<string, string | undefined>, resetPage?: boolean) => void;
}

export const CatalogPagination = ({ meta, onUpdateFilters }: CatalogPaginationProps) => (
  <>
    <div className="catalog-results-meta">
      <p>Showing {meta.totalItems} {meta.totalItems === 1 ? "product" : "products"}</p>
    </div>
    {meta.totalPages > 1 && (
      <nav className="pagination" aria-label="Product pagination">
        <button type="button" disabled={meta.page <= 1} onClick={() => onUpdateFilters({ page: String(meta.page - 1) }, false)}>
          Previous
        </button>
        <span>
          Page {meta.page} / {meta.totalPages}
        </span>
        <button type="button" disabled={meta.page >= meta.totalPages} onClick={() => onUpdateFilters({ page: String(meta.page + 1) }, false)}>
          Next
        </button>
      </nav>
    )}
  </>
);
