import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { CatalogFilters } from "./CatalogFilters.js";
import { CatalogPagination } from "./CatalogPagination.js";
import { ProductGrid, ProductGridSkeleton } from "./ProductGrid.js";
import { useCategoriesQuery, useProductsQuery } from "../hooks/useCatalogQueries.js";
import { getCatalogParams } from "../utils/catalogParams.js";

export const CatalogPageView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => getCatalogParams(searchParams), [searchParams]);
  const categoriesQuery = useCategoriesQuery();
  const productsQuery = useProductsQuery(params);
  const products = productsQuery.data?.products ?? [];
  const meta = productsQuery.data?.meta;
  const hasFilters = Boolean(params.category || params.roomType || params.q || params.minPriceMinor !== undefined || params.maxPriceMinor !== undefined);

  const updateFilters = (updates: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });

    if (resetPage) {
      next.delete("page");
    }

    setSearchParams(next);
  };

  const clearSearch = () => {
    onUpdateFilters({ q: undefined });
  };

  const onUpdateFilters = updateFilters;

  return (
    <section className="catalog-page">
      <div className="catalog-header">
        <div>
          <h2>{params.q ? "Kết quả tìm kiếm" : "Tất cả sản phẩm"}</h2>
        </div>
        {!params.q && <p>Khám phá bộ sưu tập nội thất của chúng tôi.</p>}
      </div>

      {/* Search result indicator */}
      {params.q && (
        <div className="search-result-indicator">
          <span className="search-result-text">
            Tìm kiếm cho: <strong>"{params.q}"</strong>
            {meta && productsQuery.isSuccess && (
              <span className="search-result-count"> — {meta.totalItems} sản phẩm</span>
            )}
          </span>
          <button
            type="button"
            className="search-clear-btn"
            onClick={clearSearch}
            aria-label="Xoá tìm kiếm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Xoá tìm kiếm
          </button>
        </div>
      )}

      <CatalogFilters
        categories={categoriesQuery.data}
        isLoadingCategories={categoriesQuery.isLoading}
        params={params}
        onUpdateFilters={updateFilters}
      />

      {productsQuery.isLoading && <ProductGridSkeleton />}

      {productsQuery.isError && (
        <section className="panel">
          <h3>Unable to load products</h3>
          <p className="status-error">{productsQuery.error.message}</p>
          <button type="button" className="primary-action" onClick={() => void productsQuery.refetch()}>
            Retry
          </button>
        </section>
      )}

      {productsQuery.isSuccess && products.length === 0 && (
        <section className="panel">
          <h3>{hasFilters ? "Không tìm thấy sản phẩm" : "Chưa có sản phẩm"}</h3>
          <p>{hasFilters ? "Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm." : "Danh mục chưa có sản phẩm nào."}</p>
          {params.q && (
            <button type="button" className="secondary-action" onClick={clearSearch}>
              Xoá tìm kiếm
            </button>
          )}
        </section>
      )}

      {productsQuery.isSuccess && products.length > 0 && (
        <>
          {meta && <CatalogPagination meta={meta} params={params} onUpdateFilters={updateFilters} />}
          <ProductGrid categories={categoriesQuery.data} products={products} />
        </>
      )}
    </section>
  );
};
