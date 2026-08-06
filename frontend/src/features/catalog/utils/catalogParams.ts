import type { ProductListParams, ProductSort, RoomType } from "../types.js";

const DEFAULT_LIMIT = 12;
const SORT_OPTIONS: ProductSort[] = ["newest", "price_asc", "price_desc"];
const ROOM_TYPES: RoomType[] = ["LIVING_ROOM", "BEDROOM", "DINING_ROOM", "WORKING_ROOM", "OUTDOOR", "DECOR"];

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

const parseRoomType = (value: string | null): RoomType | undefined => {
  if (value && ROOM_TYPES.includes(value as RoomType)) {
    return value as RoomType;
  }
  return undefined;
};

export const getCatalogParams = (searchParams: URLSearchParams): ProductListParams => {
  const minPriceMinor = parseNonNegativeInteger(searchParams.get("minPriceMinor"));
  const maxPriceMinor = parseNonNegativeInteger(searchParams.get("maxPriceMinor"));
  const category = searchParams.get("category")?.trim().toLowerCase();
  const roomType = parseRoomType(searchParams.get("roomType"));
  const q = searchParams.get("q")?.trim();

  return {
    page: parsePositiveInteger(searchParams.get("page")) ?? 1,
    limit: DEFAULT_LIMIT,
    sort: parseSort(searchParams.get("sort")),
    ...(category ? { category } : {}),
    ...(roomType ? { roomType } : {}),
    ...(q ? { q } : {}),
    ...(minPriceMinor !== undefined ? { minPriceMinor } : {}),
    ...(maxPriceMinor !== undefined && minPriceMinor !== undefined && maxPriceMinor >= minPriceMinor ? { maxPriceMinor } : {})
  };
};
