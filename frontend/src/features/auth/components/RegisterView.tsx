import { type FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useRegister } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";

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

  if (user) {
    return <Navigate to="/account" replace />;
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldError(null);

    if (fullName.trim().length < 2) {
      setFieldError("Full name must be at least 2 characters.");
      return;
    }

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setFieldError("Password must be at least 8 characters and include letters and numbers.");
      return;
    }

    register.mutate(
      { fullName, email, password },
      {
        onSuccess: () => {
          navigate("/login", {
            state: {
              registered: true,
              registeredEmail: email,
              message: "Đăng ký tài khoản thành công! Vui lòng đăng nhập."
            }
          });
        }
      }
    );
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-hero-side">
        <div>
          <p className="eyebrow" style={{ color: "#d97706" }}>Gia nhập cùng chúng tôi</p>
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
        <p style={{ margin: "0 0 16px", color: "var(--color-text-muted)", fontSize: "14px" }}>
          Điền thông tin bên dưới để khởi tạo tài khoản mới
        </p>
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
    </div>
  );
};
