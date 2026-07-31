import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useCategoriesQuery, useProductsQuery } from "../hooks/useCatalogQueries.js";
import { useAddCartItem } from "../hooks/useCartQueries.js";
import { useAuthStore } from "../store/authStore.js";
import type { Product, ProductListParams, ProductSort } from "../types/catalog.js";

const DEFAULT_LIMIT = 12;
const SORT_OPTIONS: ProductSort[] = ["newest", "price_asc", "price_desc"];

const parsePositiveInteger = (value: string | null): number | undefined => {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const parseNonNegativeInteger = (value: string | null): number | undefined => {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

const parseSort = (value: string | null): ProductSort => {
  if (value && SORT_OPTIONS.includes(value as ProductSort)) {
    return value as ProductSort;
  }

  return "newest";
};

const getCatalogParams = (searchParams: URLSearchParams): ProductListParams => {
  const minPriceMinor = parseNonNegativeInteger(searchParams.get("minPriceMinor"));
  const maxPriceMinor = parseNonNegativeInteger(searchParams.get("maxPriceMinor"));
  const category = searchParams.get("category")?.trim().toLowerCase();
  const q = searchParams.get("q")?.trim();

  return {
    page: parsePositiveInteger(searchParams.get("page")) ?? 1,
    limit: DEFAULT_LIMIT,
    sort: parseSort(searchParams.get("sort")),
    ...(category ? { category } : {}),
    ...(q ? { q } : {}),
    ...(minPriceMinor !== undefined ? { minPriceMinor } : {}),
    ...(maxPriceMinor !== undefined && minPriceMinor !== undefined && maxPriceMinor >= minPriceMinor ? { maxPriceMinor } : {})
  };
};

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);

const ProductCard = ({ product }: { product: Product }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const addCartItem = useAddCartItem();
  const image = product.images[0];
  const isOutOfStock = product.stockQuantity === 0;
  const isAdding = addCartItem.isPending && addCartItem.variables?.productId === product.id;
  const addToCart = () => {
    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    addCartItem.mutate({ productId: product.id, quantity: 1 });
  };

  return (
    <article className="product-card">
      <Link to={`/products/${product.slug}`} className="product-card-image" aria-label={`View ${product.name}`}>
        {image ? <img src={image.url} alt={image.alt ?? product.name} /> : <span>No image</span>}
      </Link>
      <div className="product-card-body">
        <h3>
          <Link to={`/products/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="product-price">{formatPrice(product.priceMinor, product.currency)}</p>
        <p className={isOutOfStock ? "stock-status stock-status-empty" : "stock-status"}>
          {isOutOfStock ? "Out of stock" : `${product.stockQuantity} in stock`}
        </p>
        {addCartItem.error && <p className="status-error">{addCartItem.error.message}</p>}
        <button type="button" className="secondary-action" disabled={isOutOfStock || isAdding} onClick={addToCart}>
          {isAdding ? "Adding..." : isOutOfStock ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </article>
  );
};

export const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => getCatalogParams(searchParams), [searchParams]);
  const categoriesQuery = useCategoriesQuery();
  const productsQuery = useProductsQuery(params);
  const [searchInput, setSearchInput] = useState(params.q ?? "");
  const [minPriceInput, setMinPriceInput] = useState(params.minPriceMinor === undefined ? "" : String(params.minPriceMinor));
  const [maxPriceInput, setMaxPriceInput] = useState(params.maxPriceMinor === undefined ? "" : String(params.maxPriceMinor));

  useEffect(() => {
    setSearchInput(params.q ?? "");
    setMinPriceInput(params.minPriceMinor === undefined ? "" : String(params.minPriceMinor));
    setMaxPriceInput(params.maxPriceMinor === undefined ? "" : String(params.maxPriceMinor));
  }, [params.maxPriceMinor, params.minPriceMinor, params.q]);

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

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateFilters({ q: searchInput.trim() || undefined });
  };

  const products = productsQuery.data?.products ?? [];
  const meta = productsQuery.data?.meta;
  const hasFilters = Boolean(params.category || params.q || params.minPriceMinor !== undefined || params.maxPriceMinor !== undefined);

  return (
    <section className="catalog-page">
      <div className="catalog-header">
        <div>
          <p className="eyebrow">Storefront</p>
          <h2>Products</h2>
        </div>
        <p>Browse active products from the public catalog API.</p>
      </div>

      <form className="catalog-filters" onSubmit={submitSearch}>
        <label>
          Search
          <div className="inline-control">
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Product name" />
            <button type="submit">Search</button>
          </div>
        </label>

        <label>
          Category
          <select
            value={params.category ?? ""}
            onChange={(event) => updateFilters({ category: event.target.value || undefined })}
            disabled={categoriesQuery.isLoading}
          >
            <option value="">All categories</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Sort
          <select value={params.sort} onChange={(event) => updateFilters({ sort: event.target.value })}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </label>

        <label>
          Min price
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={minPriceInput}
            onChange={(event) => setMinPriceInput(event.target.value)}
            onBlur={(event) => updateFilters({ minPriceMinor: event.target.value || undefined })}
            placeholder="Minor units"
          />
        </label>

        <label>
          Max price
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={maxPriceInput}
            onChange={(event) => setMaxPriceInput(event.target.value)}
            onBlur={(event) => updateFilters({ maxPriceMinor: event.target.value || undefined })}
            placeholder="Minor units"
          />
        </label>
      </form>

      {productsQuery.isLoading && (
        <div className="product-grid" aria-label="Loading products">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="product-card product-card-skeleton" key={index}>
              <div className="product-card-image" />
              <div className="product-card-body">
                <span />
                <span />
                <span />
              </div>
            </div>
          ))}
        </div>
      )}

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
          <h3>{hasFilters ? "No matching products" : "No products available"}</h3>
          <p>{hasFilters ? "Try adjusting the current filters." : "The catalog does not have active products yet."}</p>
        </section>
      )}

      {productsQuery.isSuccess && products.length > 0 && (
        <>
          <div className="catalog-results-meta">
            <p>
              Showing page {meta?.page ?? params.page} of {meta?.totalPages ?? 1}
            </p>
            <p>{meta?.totalItems ?? products.length} products</p>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
          {meta && meta.totalPages > 1 && (
            <nav className="pagination" aria-label="Product pagination">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => updateFilters({ page: String(meta.page - 1) }, false)}
              >
                Previous
              </button>
              <span>
                Page {meta.page} / {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={meta.page >= meta.totalPages}
                onClick={() => updateFilters({ page: String(meta.page + 1) }, false)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
};
