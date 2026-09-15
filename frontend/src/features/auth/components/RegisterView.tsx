import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { config } from "../../../config/env.js";
import { useRegister } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";
import { GoogleAuthButton } from "./GoogleAuthButton.js";
import { OtpVerificationModal } from "./OtpVerificationModal.js";

export const RegisterView = () => {
  const navigate = useNavigate();
  const error = useAuthStore((state) => state.error);
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const register = useRegister();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    if (fullName.trim().length < 2) {
      setFieldError("Họ và tên phải có ít nhất 2 ký tự.");
      return;
    }

    if (!email.trim()) {
      setFieldError("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setFieldError("Mật khẩu phải từ 8 ký tự trở lên, bao gồm cả chữ và số.");
      return;
    }

    register.mutate(
      { fullName, email, password },
      {
        onSuccess: (result) => {
          setPendingEmail(result.email);
          setShowOtpModal(true);
        }
      }
    );
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-hero-side">
        <div>
          <p className="eyebrow">Gia nhập cùng chúng tôi</p>
          <h2>Tạo tài khoản mua sắm cá nhân hóa</h2>
          <p>Nhận ngay các ưu đãi đặc quyền, quản lý địa chỉ nhận hàng và mua sắm dễ dàng hơn bao giờ hết.</p>
        </div>
        <div className="auth-features-list">
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Ưu đãi độc quyền cho thành viên</span>
          </div>
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Theo dõi hành trình đơn hàng trực tiếp</span>
          </div>
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Hỗ trợ ưu tiên 24/7</span>
          </div>
        </div>
      </div>

      <section className="panel auth-panel">
        <h2>Đăng ký tài khoản</h2>

        {config.googleClientId && (
          <>
            <GoogleAuthButton onSuccess={() => navigate("/")} />
            <div style={{ display: "flex", alignItems: "center", margin: "16px 0", color: "var(--color-text-muted)", fontSize: "13px" }}>
              <div style={{ flex: 1, borderBottom: "1px solid #e5e7eb" }} />
              <span style={{ padding: "0 10px" }}>hoặc đăng ký với email</span>
              <div style={{ flex: 1, borderBottom: "1px solid #e5e7eb" }} />
            </div>
          </>
        )}

        <form className="auth-form" onSubmit={submit}>
          <label>
            Họ và tên
            <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Nguyễn Văn A" />
          </label>
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
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự, gồm chữ và số"
            />
          </label>
          {(fieldError || error) && <p className="status-error">{fieldError ?? error}</p>}
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>
        <p className="auth-switch">
          Đã có tài khoản? <Link to="/login" className="text-link">Đăng nhập</Link>
        </p>
      </section>

      {showOtpModal && pendingEmail && (
        <OtpVerificationModal
          email={pendingEmail}
          onSuccess={() => navigate("/")}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
};
