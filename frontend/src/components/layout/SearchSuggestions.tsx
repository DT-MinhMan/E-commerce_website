import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listProducts } from "../../features/catalog/services/catalogService.js";
import type { Product } from "../../features/catalog/types.js";

const formatPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: currency || "VND"
  }).format(priceMinor / (currency === "VND" ? 1 : 100));

interface SearchSuggestionsProps {
  query: string;
  visible: boolean;
  onClose: () => void;
}

export const SearchSuggestions = ({ query, visible, onClose }: SearchSuggestionsProps) => {
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(() => {
      // Abort previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      listProducts({ page: 1, limit: 6, sort: "newest", q: trimmed }, controller.signal)
        .then((data) => {
          setResults(data.products);
          setIsLoading(false);
        })
        .catch((err) => {
          if (err?.code !== "ERR_CANCELED" && err?.name !== "AbortError" && err?.message !== "canceled") {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [query]);

  if (!visible || query.trim().length < 2) {
    return null;
  }

  return (
    <div className="search-suggestions">
      {isLoading && (
        <div className="search-suggestions-loading">
          <span className="search-spinner" />
          Đang tìm kiếm...
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className="search-suggestions-empty">
          Không tìm thấy sản phẩm nào cho "{query.trim()}"
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <ul className="search-suggestions-list">
          {results.map((product) => {
            const image = product.images[0];
            return (
              <li key={product.id}>
                <Link
                  to={`/products/${product.slug}`}
                  className="search-suggestion-item"
                  onClick={onClose}
                >
                  <div className="search-suggestion-img">
                    {image ? (
                      <img src={image.url} alt={image.alt ?? product.name} loading="lazy" />
                    ) : (
                      <span className="search-suggestion-no-img">—</span>
                    )}
                  </div>
                  <div className="search-suggestion-info">
                    <span className="search-suggestion-name">{product.name}</span>
                    <span className="search-suggestion-price">
                      {formatPrice(product.priceMinor, product.currency)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && results.length > 0 && (
        <Link
          to={`/products?q=${encodeURIComponent(query.trim())}`}
          className="search-suggestions-viewall"
          onClick={onClose}
        >
          Xem tất cả kết quả →
        </Link>
      )}
    </div>
  );
};
