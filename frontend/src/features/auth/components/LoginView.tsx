import { type FormEvent, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import type { ApiError } from "../../../lib/apiClient.js";
import { config } from "../../../config/env.js";
import { useLogin, useResendOtp } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";
import { GoogleAuthButton } from "./GoogleAuthButton.js";
import { OtpVerificationModal } from "./OtpVerificationModal.js";

interface LocationState {
  from?: {
    pathname?: string;
  };
  registered?: boolean;
  registeredEmail?: string;
  message?: string;
}

export const LoginView = () => {
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const error = useAuthStore((state) => state.error);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const login = useLogin();
  const resendOtp = useResendOtp();
  const [email, setEmail] = useState(locationState?.registeredEmail ?? "");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pendingVerifyEmail, setPendingVerifyEmail] = useState<string | null>(null);
  const successMessage = locationState?.message ?? (locationState?.registered ? "Đăng ký tài khoản thành công! Vui lòng đăng nhập." : null);

  if (user) {
    const destination = locationState?.from?.pathname ?? (user.role === "ADMIN" ? "/admin" : "/");
    return <Navigate to={destination} replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    if (!email.trim() || !password) {
      setFieldError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    login.mutate(
      { email, password },
      {
        onError: (err) => {
          const apiErr = err as ApiError;
          if (apiErr.message?.toLowerCase().includes("not verified") || apiErr.code === "AUTH_EMAIL_NOT_VERIFIED") {
            resendOtp.mutate({ email });
            setPendingVerifyEmail(email);
          }
        }
      }
    );
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-hero-side">
        <div>
          <p className="eyebrow">Cửa hàng trực tuyến</p>
          <h2>Trải nghiệm mua sắm hiện đại & bảo mật</h2>
          <p>Đăng nhập để quản lý đơn hàng, theo dõi giao hàng và lưu lại danh sách sản phẩm yêu thích.</p>
        </div>
        <div className="auth-features-list">
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Thanh toán an toàn & nhanh chóng</span>
          </div>
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Giao hàng tận nơi toàn quốc</span>
          </div>
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Đổi trả linh hoạt trong 30 ngày</span>
          </div>
        </div>
      </div>

      <section className="panel auth-panel">
        <h2>Đăng nhập</h2>

        {config.googleClientId && (
          <>
            <GoogleAuthButton />
            <div style={{ display: "flex", alignItems: "center", margin: "16px 0", color: "var(--color-text-muted)", fontSize: "13px" }}>
              <div style={{ flex: 1, borderBottom: "1px solid #e5e7eb" }} />
              <span style={{ padding: "0 10px" }}>hoặc đăng nhập với email</span>
              <div style={{ flex: 1, borderBottom: "1px solid #e5e7eb" }} />
            </div>
          </>
        )}

        <form className="auth-form" onSubmit={submit}>
          {successMessage && <p className="status-success">{successMessage}</p>}
          <label>
            Email
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="name@example.com" />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
          {(fieldError || error) && <p className="status-error">{fieldError ?? error}</p>}
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register" className="text-link">Đăng ký ngay</Link>
        </p>
      </section>

      {pendingVerifyEmail && (
        <OtpVerificationModal
          email={pendingVerifyEmail}
          onSuccess={() => setPendingVerifyEmail(null)}
          onClose={() => setPendingVerifyEmail(null)}
        />
      )}
    </div>
  );
};
