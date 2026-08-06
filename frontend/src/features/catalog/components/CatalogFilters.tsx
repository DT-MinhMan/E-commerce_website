import { type FormEvent, useEffect, useState } from "react";
import { ROOM_TYPE_LABELS, type Category, type ProductListParams, type RoomType } from "../types.js";

interface CatalogFiltersProps {
  categories?: Category[];
  isLoadingCategories: boolean;
  params: ProductListParams;
  onUpdateFilters: (updates: Record<string, string | undefined>, resetPage?: boolean) => void;
}

export const CatalogFilters = ({ categories = [], isLoadingCategories, params, onUpdateFilters }: CatalogFiltersProps) => {
  const [searchInput, setSearchInput] = useState(params.q ?? "");
  const [maxPriceInput, setMaxPriceInput] = useState(params.maxPriceMinor === undefined ? "" : String(params.maxPriceMinor));

  useEffect(() => {
    setSearchInput(params.q ?? "");
    setMaxPriceInput(params.maxPriceMinor === undefined ? "" : String(params.maxPriceMinor));
  }, [params.maxPriceMinor, params.q]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onUpdateFilters({ q: searchInput.trim() || undefined });
  };

  const clearSearchInput = () => {
    setSearchInput("");
    onUpdateFilters({ q: undefined });
  };

  return (
    <form className="catalog-filters" onSubmit={submitSearch}>
      <label>
        Tìm kiếm
        <div className="inline-control search-input-wrapper">
          <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tên sản phẩm..." />
          {searchInput && (
            <button
              type="button"
              className="search-input-clear"
              onClick={clearSearchInput}
              aria-label="Xoá từ khoá"
            >
              ✕
            </button>
          )}
          <button type="submit">Tìm</button>
        </div>
      </label>

      <label>
        Danh mục
        <select
          value={params.category ?? ""}
          onChange={(event) => onUpdateFilters({ category: event.target.value || undefined })}
          disabled={isLoadingCategories}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Không gian phòng
        <select
          value={params.roomType ?? ""}
          onChange={(event) => onUpdateFilters({ roomType: event.target.value || undefined })}
        >
          <option value="">Tất cả không gian</option>
          {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map((key) => (
            <option key={key} value={key}>
              {ROOM_TYPE_LABELS[key]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sắp xếp
        <select value={params.sort} onChange={(event) => onUpdateFilters({ sort: event.target.value })}>
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá: thấp đến cao</option>
          <option value="price_desc">Giá: cao đến thấp</option>
        </select>
      </label>

      <label>
        Giá tối đa
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={maxPriceInput}
          onChange={(event) => setMaxPriceInput(event.target.value)}
          onBlur={(event) => onUpdateFilters({ maxPriceMinor: event.target.value || undefined })}
          placeholder="VNĐ"
        />
      </label>
    </form>
  );
};
