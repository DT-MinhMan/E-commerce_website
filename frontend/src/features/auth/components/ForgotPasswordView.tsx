import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ApiError } from "../../../lib/apiClient.js";
import { useForgotPassword, useResetPassword } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";

export const ForgotPasswordView = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const forgotMutation = useForgotPassword();
  const resetMutation = useResetPassword();

  // If user is already logged in, redirect away
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Cooldown countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg("Vui lòng nhập địa chỉ email.");
      return;
    }

    forgotMutation.mutate(
      { email: trimmedEmail },
      {
        onSuccess: () => {
          setInfoMsg("Nếu email tồn tại trong hệ thống, mã xác thực 6 chữ số đã được gửi. Vui lòng kiểm tra hộp thư.");
          setStep(2);
          setCountdown(60);
        },
        onError: (err) => {
          const apiErr = err as ApiError;
          setErrorMsg(apiErr.message ?? "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.");
        }
      }
    );
  };

  const handleResendOtp = () => {
    if (countdown > 0 || forgotMutation.isPending) return;
    setErrorMsg(null);
    setInfoMsg(null);

    forgotMutation.mutate(
      { email: email.trim().toLowerCase() },
      {
        onSuccess: () => {
          setInfoMsg("Mã xác thực mới đã được gửi nếu email hợp lệ.");
          setCountdown(60);
        },
        onError: (err) => {
          const apiErr = err as ApiError;
          setErrorMsg(apiErr.message ?? "Không thể gửi lại mã xác thực.");
        }
      }
    );
  };

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);

    const trimmedCode = code.trim();
    if (!trimmedCode || trimmedCode.length !== 6) {
      setErrorMsg("Vui lòng nhập mã xác thực gồm đúng 6 chữ số.");
      return;
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm cả chữ và số.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    resetMutation.mutate(
      {
        email: email.trim().toLowerCase(),
        code: trimmedCode,
        newPassword
      },
      {
        onSuccess: () => {
          navigate("/login", {
            state: {
              message: "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới."
            },
            replace: true
          });
        },
        onError: (err) => {
          const apiErr = err as ApiError;
          if (apiErr.code === "AUTH_PASSWORD_SAME_AS_OLD") {
            setErrorMsg("Mật khẩu mới không được trùng với mật khẩu hiện tại của bạn.");
          } else if (apiErr.code === "AUTH_OTP_MAX_ATTEMPTS") {
            setErrorMsg("Bạn đã nhập sai mã quá 5 lần. Vui lòng gửi lại mã xác thực mới.");
          } else if (apiErr.code === "AUTH_RESET_CODE_EXPIRED") {
            setErrorMsg("Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.");
          } else if (apiErr.code === "AUTH_RESET_CODE_INVALID") {
            setErrorMsg("Mã xác thực không chính xác. Vui lòng kiểm tra lại.");
          } else {
            setErrorMsg(apiErr.message ?? "Đặt lại mật khẩu không thành công. Vui lòng thử lại.");
          }
        }
      }
    );
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-hero-side">
        <div>
          <p className="eyebrow">Bảo mật tài khoản</p>
          <h2>Khôi phục quyền truy cập</h2>
          <p>
            Đừng lo lắng, chúng tôi sẽ hướng dẫn bạn các bước nhanh chóng và an toàn để đặt lại mật khẩu của mình.
          </p>
        </div>
        <div className="auth-features-list">
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Bảo vệ tài khoản với mã OTP một lần</span>
          </div>
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Đổi mật khẩu bảo mật và tức thì</span>
          </div>
          <div className="auth-feature-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Tự động hủy các phiên đăng nhập cũ</span>
          </div>
        </div>
      </div>

      <section className="panel auth-panel">
        <h2>{step === 1 ? "Quên mật khẩu" : "Đặt lại mật khẩu"}</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "20px" }}>
          {step === 1
            ? "Nhập email đăng ký của bạn. Chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu."
            : `Nhập mã 6 chữ số đã gửi tới ${email} cùng mật khẩu mới.`}
        </p>

        {infoMsg && <p className="status-success">{infoMsg}</p>}
        {errorMsg && <p className="status-error">{errorMsg}</p>}

        {step === 1 ? (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <label>
              Email đăng ký
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
                required
                disabled={forgotMutation.isPending}
              />
            </label>
            <button type="submit" disabled={forgotMutation.isPending}>
              {forgotMutation.isPending ? "Đang gửi yêu cầu..." : "Gửi mã xác thực"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                Email: <strong>{email}</strong>
              </span>
              <button
                type="button"
                className="text-link"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", padding: 0 }}
                onClick={() => {
                  setStep(1);
                  setErrorMsg(null);
                  setInfoMsg(null);
                }}
              >
                Đổi email khác
              </button>
            </div>

            <label>
              Mã xác thực (6 chữ số)
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                required
                style={{ letterSpacing: "4px", fontSize: "18px", fontWeight: 600, textAlign: "center" }}
              />
            </label>

            <label>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Mật khẩu mới</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--color-primary)" }}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Ít nhất 8 ký tự, gồm chữ và số"
                required
              />
            </label>

            <label>
              Xác nhận mật khẩu mới
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </label>

            <button type="submit" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Đang đặt lại mật khẩu..." : "Đặt lại mật khẩu"}
            </button>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || forgotMutation.isPending}
                style={{
                  background: "none",
                  border: "none",
                  cursor: countdown > 0 ? "not-allowed" : "pointer",
                  color: countdown > 0 ? "var(--color-text-muted)" : "var(--color-primary)",
                  fontSize: "13px"
                }}
              >
                {countdown > 0 ? `Gửi lại mã sau (${countdown}s)` : "Chưa nhận được mã? Gửi lại"}
              </button>
            </div>
          </form>
        )}

        <p className="auth-switch">
          Quay lại <Link to="/login" className="text-link">Đăng nhập</Link>
        </p>
      </section>
    </div>
  );
};
