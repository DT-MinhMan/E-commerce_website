export const translateOrderStatus = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    PENDING_PAYMENT: "Chờ thanh toán",
    PAID: "Đã thanh toán",
    PROCESSING: "Đang xử lý",
    SHIPPED: "Đang giao hàng",
    COMPLETED: "Hoàn tất",
    CANCELLED: "Đã hủy",
    RETURNED: "Đã hoàn trả",
    REFUNDED: "Đã hoàn tiền",
    PAYMENT_REVIEW: "Cần kiểm tra"
  };
  return map[status] || status;
};

export const translatePaymentStatus = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    PROCESSING: "Đang xử lý",
    PAID: "Đã thanh toán",
    SUCCEEDED: "Đã thanh toán",
    FAILED: "Thất bại",
    REFUNDED: "Đã hoàn tiền"
  };
  return map[status] || status;
};

export const translatePaymentMethod = (method?: string): string => {
  const map: Record<string, string> = {
    COD: "Thanh toán khi nhận hàng (COD)",
    CARD: "Thẻ tín dụng / Stripe"
  };
  return map[method ?? ""] || method || "Thanh toán khi nhận hàng (COD)";
};

export const getOrderStatusColorClass = (status: string): string => {
  switch (status) {
    case "PAID":
    case "COMPLETED":
      return "order-badge--success";
    case "PENDING":
    case "PENDING_PAYMENT":
      return "order-badge--warning";
    case "PROCESSING":
    case "SHIPPED":
      return "order-badge--info";
    case "CANCELLED":
    case "REFUNDED":
    case "RETURNED":
      return "order-badge--danger";
    case "PAYMENT_REVIEW":
      return "order-badge--alert";
    default:
      return "order-badge--neutral";
  }
};

export const getPaymentStatusColorClass = (status: string): string => {
  switch (status) {
    case "PAID":
    case "SUCCEEDED":
      return "order-badge--success";
    case "PENDING":
    case "PROCESSING":
      return "order-badge--warning";
    case "FAILED":
    case "REFUNDED":
      return "order-badge--danger";
    default:
      return "order-badge--neutral";
  }
};

export const formatOrderDate = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

export const formatPrice = (priceMinor: number, currency: string): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(priceMinor / 100);
};

export const isPayableOrder = (orderStatus: string, paymentStatus: string, paymentMethod?: string): boolean => {
  if (paymentMethod === "COD") {
    return false;
  }

  return (paymentStatus === "PENDING" || paymentStatus === "FAILED") && orderStatus !== "CANCELLED" && orderStatus !== "RETURNED";
};

export const isCancellableOrder = (orderStatus: string, paymentStatus: string): boolean => {
  return orderStatus === "PENDING" && paymentStatus !== "PAID";
};

