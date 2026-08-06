export const formatCartPrice = (priceMinor: number, currency: string): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);
