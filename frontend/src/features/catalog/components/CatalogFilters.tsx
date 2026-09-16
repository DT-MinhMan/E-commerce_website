import { type FormEvent, useEffect, useState } from "react";
import { ROOM_TYPE_LABELS, type Category, type ProductListParams, type RoomType } from "../types.js";

interface CatalogFiltersProps {
  categories?: Category[];
  isLoadingCategories: boolean;
  params: ProductListParams;
  onUpdateFilters: (updates: Record<string, string | undefined>, resetPage?: boolean) => void;
}

interface PricePreset {
  label: string;
  min?: number;
  max?: number;
}

const PRICE_PRESETS: PricePreset[] = [
  { label: "Tất cả" },
  { label: "Dưới 1 triệu", max: 1_000_000 },
  { label: "1 - 3 triệu", min: 1_000_000, max: 3_000_000 },
  { label: "3 - 7 triệu", min: 3_000_000, max: 7_000_000 },
  { label: "Trên 7 triệu", min: 7_000_000 }
];

export const CatalogFilters = ({ categories = [], isLoadingCategories, params, onUpdateFilters }: CatalogFiltersProps) => {
  const [searchInput, setSearchInput] = useState(params.q ?? "");
  const [minPriceInput, setMinPriceInput] = useState(params.minPriceMinor === undefined ? "" : String(params.minPriceMinor));
  const [maxPriceInput, setMaxPriceInput] = useState(params.maxPriceMinor === undefined ? "" : String(params.maxPriceMinor));

  useEffect(() => {
    setSearchInput(params.q ?? "");
    setMinPriceInput(params.minPriceMinor === undefined ? "" : String(params.minPriceMinor));
    setMaxPriceInput(params.maxPriceMinor === undefined ? "" : String(params.maxPriceMinor));
  }, [params.minPriceMinor, params.maxPriceMinor, params.q]);

  const applyPriceRange = () => {
    const minVal = minPriceInput.trim() ? minPriceInput.trim() : undefined;
    const maxVal = maxPriceInput.trim() ? maxPriceInput.trim() : undefined;
    const currentMinStr = params.minPriceMinor !== undefined ? String(params.minPriceMinor) : undefined;
    const currentMaxStr = params.maxPriceMinor !== undefined ? String(params.maxPriceMinor) : undefined;

    if (minVal !== currentMinStr || maxVal !== currentMaxStr) {
      onUpdateFilters({
        minPriceMinor: minVal,
        maxPriceMinor: maxVal
      });
    }
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minVal = minPriceInput.trim() ? minPriceInput.trim() : undefined;
    const maxVal = maxPriceInput.trim() ? maxPriceInput.trim() : undefined;
    onUpdateFilters({
      q: searchInput.trim() || undefined,
      minPriceMinor: minVal,
      maxPriceMinor: maxVal
    });
  };

  const selectPreset = (preset: PricePreset) => {
    const minVal = preset.min !== undefined ? String(preset.min) : undefined;
    const maxVal = preset.max !== undefined ? String(preset.max) : undefined;
    setMinPriceInput(minVal ?? "");
    setMaxPriceInput(maxVal ?? "");
    onUpdateFilters({
      minPriceMinor: minVal,
      maxPriceMinor: maxVal
    });
  };

  const isPresetActive = (preset: PricePreset) => {
    const curMin = params.minPriceMinor;
    const curMax = params.maxPriceMinor;
    if (preset.min === undefined && preset.max === undefined) {
      return curMin === undefined && curMax === undefined;
    }
    return curMin === preset.min && curMax === preset.max;
  };

  const clearSearchInput = () => {
    setSearchInput("");
    onUpdateFilters({ q: undefined });
  };

  return (
    <div className="catalog-filters-wrapper">
      <form className="catalog-filters" onSubmit={submitForm}>
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

        <label className="price-range-group">
          Khoảng giá (VNĐ)
          <div className="price-inputs-row">
            <input
              type="number"
              min="0"
              step="100000"
              inputMode="numeric"
              value={minPriceInput}
              onChange={(event) => setMinPriceInput(event.target.value)}
              onBlur={applyPriceRange}
              placeholder="Từ"
              aria-label="Giá tối thiểu"
            />
            <span className="price-sep">-</span>
            <input
              type="number"
              min="0"
              step="100000"
              inputMode="numeric"
              value={maxPriceInput}
              onChange={(event) => setMaxPriceInput(event.target.value)}
              onBlur={applyPriceRange}
              placeholder="Đến"
              aria-label="Giá tối đa"
            />
          </div>
        </label>
      </form>

      <div className="price-presets-bar">
        <span className="price-presets-title">Mức giá:</span>
        <div className="price-presets-chips">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`price-preset-chip ${isPresetActive(preset) ? "active" : ""}`}
              onClick={() => selectPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
