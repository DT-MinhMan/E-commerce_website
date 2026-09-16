export const formatPrice = (priceMinor?: number | null, currency: string = "VND"): string => {
  if (priceMinor === null || priceMinor === undefined || Number.isNaN(priceMinor)) {
    return "—";
  }
  const curr = currency || "VND";
  const divisor = curr.toUpperCase() === "VND" ? 1 : 100;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: curr
  }).format(priceMinor / divisor);
};

export const formatCartPrice = formatPrice;
