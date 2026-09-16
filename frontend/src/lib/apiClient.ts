import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { config } from "../config/env.js";
import type { AuthSession } from "../features/auth/types.js";

export interface ApiError {
  message: string;
  code?: string;
  requestId?: string;
}

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
  requestId?: string;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface AuthHandlers {
  onSessionRefreshed?: (session: AuthSession) => void;
  onSessionExpired?: () => void;
}

interface AuthResponse {
  success: true;
  data: AuthSession;
  meta: unknown;
}

let accessToken: string | null = null;
let refreshPromise: Promise<AuthSession> | null = null;
let authHandlers: AuthHandlers = {};

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 8000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const configureAuthHandlers = (handlers: AuthHandlers): void => {
  authHandlers = handlers;
};

const shouldAttemptRefresh = (error: AxiosError<ErrorPayload>, request: RetriableRequestConfig): boolean => {
  const url = request.url ?? "";

  return (
    error.response?.status === 401 &&
    !request._retry &&
    !url.includes("/auth/")
  );
};

export const refreshSession = async (): Promise<AuthSession> => {
  refreshPromise ??= apiClient
    .post<AuthResponse>("/auth/refresh")
    .then((response) => {
      const session = response.data.data;
      setAccessToken(session.accessToken);
      authHandlers.onSessionRefreshed?.(session);
      return session;
    })
    .catch((error) => {
      setAccessToken(null);
      authHandlers.onSessionExpired?.();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

apiClient.interceptors.request.use((request) => {
  request.headers["x-request-id"] ??= globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  if (accessToken) {
    request.headers.Authorization = `Bearer ${accessToken}`;
  }

  return request;
});

const translateErrorMessage = (message: string, code?: string, status?: number): string => {
  if (status === 429 || code === "TOO_MANY_REQUESTS" || message.includes("429") || message.toLowerCase().includes("too many")) {
    return "Bạn đã thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.";
  }

  // --- Payment & Checkout Errors ---
  if (code === "CHECKOUT_CART_EMPTY") {
    return "Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi thanh toán.";
  }
  if (code === "CHECKOUT_PRODUCT_NOT_FOUND") {
    return "Sản phẩm yêu cầu thanh toán không tồn tại.";
  }
  if (code === "CHECKOUT_PRODUCT_INACTIVE") {
    return "Một hoặc nhiều sản phẩm trong giỏ hàng đã ngừng kinh doanh.";
  }
  if (code === "CHECKOUT_INSUFFICIENT_STOCK") {
    return "Số lượng yêu cầu vượt quá số lượng tồn kho sẵn có của sản phẩm.";
  }
  if (code === "CHECKOUT_CURRENCY_MISMATCH") {
    return "Giỏ hàng không đồng nhất về đơn vị tiền tệ.";
  }
  if (code === "ORDER_NOT_PAYABLE" || code === "PAYMENT_NOT_PAYABLE") {
    return "Đơn hàng này hiện không thể thực hiện thanh toán trực tuyến.";
  }
  if (code === "PAYMENT_AMOUNT_MISMATCH") {
    return "Số tiền thanh toán không khớp với giá trị đơn hàng.";
  }
  if (code === "ORDER_NOT_CANCELLABLE") {
    return "Đơn hàng không thể hủy ở trạng thái hiện tại.";
  }
  if (code === "ORDER_NOT_FOUND") {
    return "Không tìm thấy đơn hàng yêu cầu.";
  }
  if (code === "PAYMENT_NOT_FOUND") {
    return "Không tìm thấy thông tin thanh toán.";
  }
  if (code === "CHECKOUT_INVALID_ADDRESS") {
    return "Địa chỉ giao hàng không hợp lệ hoặc thiếu thông tin bắt buộc.";
  }
  if (
    code === "ORDER_NUMBER_CONFLICT" ||
    code === "CHECKOUT_TRANSACTION_FAILED" ||
    code === "STRIPE_CHECKOUT_URL_MISSING" ||
    code === "STRIPE_CONFIG_MISSING"
  ) {
    return "Cổng thanh toán trực tuyến đang gặp sự cố. Vui lòng thử lại sau.";
  }

  // --- Authentication Errors ---
  if (code === "AUTH_EMAIL_ALREADY_EXISTS" || message.toLowerCase().includes("email is already registered")) {
    return "Email này đã được đăng ký. Vui lòng chọn email khác hoặc đăng nhập.";
  }

  if (code === "AUTH_INVALID_CREDENTIALS" || message.toLowerCase().includes("invalid email or password")) {
    return "Email hoặc mật khẩu không chính xác.";
  }

  if (code === "AUTH_EMAIL_NOT_VERIFIED" || message.toLowerCase().includes("email is not verified")) {
    return "Email chưa được xác thực. Vui lòng kiểm tra hộp thư.";
  }

  if (code === "AUTH_ACCOUNT_BLOCKED" || message.toLowerCase().includes("account is blocked")) {
    return "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.";
  }

  if (code === "AUTH_ACCOUNT_INACTIVE" || message.toLowerCase().includes("account is inactive")) {
    return "Tài khoản chưa được kích hoạt.";
  }

  if (code === "AUTH_OTP_INVALID" || message.toLowerCase().includes("verification code is invalid") || message.toLowerCase().includes("incorrect")) {
    return "Mã xác thực không chính xác hoặc đã hết hạn.";
  }

  if (code === "AUTH_OTP_EXPIRED" || message.toLowerCase().includes("verification code has expired")) {
    return "Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.";
  }

  if (code === "AUTH_OTP_MAX_ATTEMPTS" || message.toLowerCase().includes("maximum verification attempts")) {
    return "Đã vượt quá số lần nhập sai cho phép. Vui lòng gửi lại mã mới.";
  }

  if (code === "AUTH_INVALID_CURRENT_PASSWORD" || message.toLowerCase().includes("current password is incorrect")) {
    return "Mật khẩu hiện tại không đúng.";
  }

  if (code === "AUTH_GOOGLE_INVALID" || message.toLowerCase().includes("google authentication failed") || message.toLowerCase().includes("verify google token")) {
    return "Đăng nhập bằng tài khoản Google thất bại hoặc tài khoản chưa được xác minh.";
  }

  if (code === "AUTH_TOKEN_MISSING" || message.toLowerCase().includes("refresh token is missing")) {
    return "Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
  }

  if (
    code === "AUTH_REFRESH_TOKEN_INVALID" ||
    code === "AUTH_REFRESH_TOKEN_REUSED" ||
    code === "AUTH_REFRESH_TOKEN_EXPIRED" ||
    code === "AUTH_ACCESS_TOKEN_INVALID" ||
    message.toLowerCase().includes("refresh token is invalid") ||
    message.toLowerCase().includes("refresh token has expired") ||
    message.toLowerCase().includes("access token is invalid")
  ) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (code === "AUTH_OTP_RESEND_FAILED" || message.toLowerCase().includes("no unverified account found")) {
    return "Không tìm thấy tài khoản chưa xác thực nào cho email này.";
  }

  // --- Validation Errors ---
  if (code === "VALIDATION_ERROR") {
    if (message.toLowerCase().includes("password must be at least 8 characters")) {
      return "Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm cả chữ cái và chữ số.";
    }
    if (message.toLowerCase().includes("email must be valid")) {
      return "Địa chỉ email không đúng định dạng.";
    }
    if (message.toLowerCase().includes("full name must be between")) {
      return "Họ và tên phải từ 2 đến 120 ký tự.";
    }
    if (message.toLowerCase().includes("verification code must be 6 digits")) {
      return "Mã xác thực phải bao gồm đúng 6 chữ số.";
    }
    if (message.toLowerCase().includes("is required")) {
      const field = message.split(" ")[0].toLowerCase();
      const fieldMap: Record<string, string> = {
        email: "Email",
        password: "Mật khẩu",
        fullname: "Họ và tên",
        code: "Mã xác thực"
      };
      const normalizedField = field.includes("name") ? "fullname" : field;
      return `${fieldMap[normalizedField] ?? field} không được để trống.`;
    }
  }

  // --- Admin & Catalog Errors ---
  if (code === "CATEGORY_SLUG_CONFLICT" || message.toLowerCase().includes("category slug is already in use")) {
    return "Đường dẫn (slug) danh mục đã tồn tại. Vui lòng chọn đường dẫn khác.";
  }
  if (code === "CATEGORY_NOT_EMPTY" || message.toLowerCase().includes("cannot deactivate category with active products")) {
    return "Không thể ẩn hoặc khóa danh mục đang chứa các sản phẩm còn hoạt động.";
  }
  if (code === "CATEGORY_NOT_FOUND" || message.toLowerCase().includes("category not found")) {
    return "Không tìm thấy danh mục yêu cầu.";
  }
  if (code === "CATEGORY_INACTIVE" || message.toLowerCase().includes("category is inactive")) {
    return "Danh mục đã bị tạm ẩn hoặc không hoạt động.";
  }
  if (code === "PRODUCT_SLUG_CONFLICT" || message.toLowerCase().includes("product slug is already in use")) {
    return "Đường dẫn (slug) sản phẩm đã tồn tại. Vui lòng chọn đường dẫn khác.";
  }
  if (code === "PRODUCT_NOT_FOUND" || message.toLowerCase().includes("product not found")) {
    return "Không tìm thấy thông tin sản phẩm.";
  }
  if (code === "PRODUCT_INACTIVE" || message.toLowerCase().includes("product is inactive")) {
    return "Sản phẩm hiện đang ở trạng thái ngừng hoạt động.";
  }
  if (code === "PRODUCT_OUT_OF_STOCK" || message.toLowerCase().includes("out of stock")) {
    return "Sản phẩm hiện đã hết hàng trong kho.";
  }

  // --- Admin Order Management & Order Status Errors ---
  if (code === "ORDER_STATUS_CONFLICT" || message.toLowerCase().includes("order status changed before this update")) {
    return "Trạng thái đơn hàng đã bị thay đổi trước đó. Vui lòng làm mới trang để cập nhật.";
  }
  if (code === "ORDER_STATUS_TRANSITION_INVALID" || message.toLowerCase().includes("order status transition is not allowed")) {
    return "Không thể chuyển sang trạng thái này từ trạng thái hiện tại của đơn hàng.";
  }

  // --- Upload & Media Errors ---
  if (code === "CLOUDINARY_CONFIG_MISSING" || message.toLowerCase().includes("cloudinary is not configured")) {
    return "Hệ thống lưu trữ hình ảnh chưa được cấu hình. Vui lòng liên hệ quản trị hệ thống.";
  }
  if (code === "CLOUDINARY_UPLOAD_FAILED" || message.toLowerCase().includes("cloudinary image upload failed")) {
    return "Tải ảnh lên máy chủ lưu trữ thất bại. Vui lòng kiểm tra lại kích thước hoặc định dạng tệp ảnh.";
  }
  if (code === "CLOUDINARY_UPLOAD_INVALID" || message.toLowerCase().includes("cloudinary upload response is invalid")) {
    return "Dịch vụ tải ảnh phản hồi không hợp lệ. Vui lòng thử lại.";
  }

  // --- User & Cart Errors ---
  if (code === "USER_NOT_FOUND" || message.toLowerCase().includes("user not found")) {
    return "Không tìm thấy thông tin người dùng.";
  }
  if (code === "CART_EMPTY" || message.toLowerCase().includes("cart is empty")) {
    return "Giỏ hàng hiện đang trống.";
  }
  if (code === "CART_ITEM_NOT_FOUND" || message.toLowerCase().includes("cart item not found")) {
    return "Không tìm thấy sản phẩm này trong giỏ hàng.";
  }

  // --- Fallback Status Code & Network Error Translation ---
  if (status) {
    if (status === 401) return "Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
    if (status === 403) return "Bạn không có quyền thực hiện thao tác quản trị này.";
    if (status === 404) return "Không tìm thấy dữ liệu yêu cầu.";
    if (status >= 500) return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
  }

  if (message.startsWith("Request failed with status code") || message === "Network Error") {
    return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại đường truyền mạng.";
  }

  return message;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorPayload>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (originalRequest && shouldAttemptRefresh(error, originalRequest)) {
      originalRequest._retry = true;
      const session = await refreshSession();
      originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
      return apiClient(originalRequest);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resData = error.response?.data as any;
    let rawMessage: string | undefined;

    if (typeof resData === "string" && resData.trim()) {
      rawMessage = resData;
    } else if (resData && typeof resData === "object") {
      rawMessage = resData.error?.message ?? resData.message ?? (typeof resData.error === "string" ? resData.error : undefined);
    }

    if (typeof rawMessage !== "string" || !rawMessage) {
      rawMessage = error.message;
    }

    const code = error.response?.data?.error?.code;
    const status = error.response?.status;

    const normalizedError: ApiError = {
      message: translateErrorMessage(rawMessage, code, status),
      code,
      requestId: error.response?.data?.requestId
    };

    return Promise.reject(normalizedError);
  }
);
