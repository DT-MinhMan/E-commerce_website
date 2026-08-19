import { type FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Loading } from "../../../components/feedback/Loading.js";
import { useChangePassword, useCurrentUser, useLogout } from "../hooks/useAuthQueries.js";
import { useAuthStore } from "../store/authStore.js";
import type { ApiError } from "../../../lib/apiClient.js";

export const AccountView = () => {
  const error = useAuthStore((state) => state.error);
  const user = useAuthStore((state) => state.user);
  const currentUser = useCurrentUser(Boolean(user));
  const logout = useLogout();
  const changePasswordMutation = useChangePassword();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  if (!user || currentUser.isLoading) {
    return <Loading />;
  }

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm cả chữ và số.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setPasswordSuccess("Đổi mật khẩu thành công!");
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setShowPasswordForm(false);
        },
        onError: (err) => {
          const apiErr = err as ApiError;
          setPasswordError(apiErr.message ?? "Đổi mật khẩu thất bại. Vui lòng thử lại.");
        }
      }
    );
  };

  const initialLetter = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  return (
    <div className="account-page-container">
      <div className="account-card panel">
        <div className="account-header">
          <div className="account-avatar">{initialLetter}</div>
          <div className="account-info">
            <h2>{user.fullName}</h2>
            <p className="account-email">{user.email}</p>
          </div>
        </div>

        {error && <p className="status-error">{error}</p>}
        {passwordSuccess && <p className="status-success">{passwordSuccess}</p>}

        <div className="account-actions">
          <Link to="/orders" className="secondary-action account-orders-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            <span>Lịch sử đơn hàng</span>
          </Link>
          <button
            type="button"
            className="secondary-action"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordError(null);
            }}
          >
            {showPasswordForm ? "Hủy đổi mật khẩu" : "Đổi mật khẩu"}
          </button>
          <button
            type="button"
            className="primary-action logout-btn"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            {logout.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
          </button>
        </div>

        {showPasswordForm && (
          <form className="password-change-form" onSubmit={handlePasswordSubmit}>
            <h3>Đổi mật khẩu</h3>
            {passwordError && <p className="status-error">{passwordError}</p>}
            <label>
              Mật khẩu hiện tại
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>
            <label>
              Mật khẩu mới
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự, gồm chữ và số"
                autoComplete="new-password"
              />
            </label>
            <label>
              Xác nhận mật khẩu mới
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              className="primary-action"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
