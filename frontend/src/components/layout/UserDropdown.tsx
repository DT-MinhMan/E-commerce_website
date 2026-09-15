import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLogout } from "../../features/auth/hooks/useAuthQueries.js";
import type { AuthUser } from "../../features/auth/types.js";

interface UserDropdownProps {
  user: AuthUser;
  onOpenChangePassword: () => void;
}

export const UserDropdown = ({ user, onOpenChangePassword }: UserDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const logout = useLogout();

  const initialLetter = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNavigateOrders = () => {
    handleClose();
    navigate("/orders");
  };

  const handleNavigateAdmin = () => {
    handleClose();
    navigate("/admin");
  };

  const handleOpenChangePassword = () => {
    handleClose();
    onOpenChangePassword();
  };

  const handleLogout = () => {
    handleClose();
    logout.mutate();
  };

  return (
    <div className="user-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        className={`user-menu-trigger ${isOpen ? "open" : ""}`}
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Tài khoản người dùng: ${user.fullName}`}
      >
        <span className="user-avatar-badge" aria-hidden="true">
          {initialLetter}
        </span>
        <span className="user-name-label">{user.fullName || "Tài khoản"}</span>
        <svg
          className={`user-caret-icon ${isOpen ? "rotated" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="user-dropdown-menu" role="menu" aria-label="Menu tài khoản">
          {/* User profile summary */}
          <div className="user-dropdown-profile">
            <div className="user-profile-avatar" aria-hidden="true">
              {initialLetter}
            </div>
            <div className="user-profile-info">
              <p className="user-profile-name">{user.fullName}</p>
              <p className="user-profile-email" title={user.email}>
                {user.email}
              </p>
              <div className="user-badge-row">
                {user.role === "ADMIN" && (
                  <span className="user-tag-badge admin-badge">Quản trị viên</span>
                )}
                {user.authProvider === "GOOGLE" && (
                  <span className="user-tag-badge google-badge">Google</span>
                )}
              </div>
            </div>
          </div>

          <div className="user-dropdown-divider" />

          {/* Navigation Items */}
          <div className="user-dropdown-items">
            <button
              type="button"
              className="user-dropdown-item"
              role="menuitem"
              onClick={handleNavigateOrders}
            >
              <span className="user-dropdown-item-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
              <span className="user-dropdown-item-text">Lịch sử đơn hàng</span>
            </button>

            {user.authProvider !== "GOOGLE" ? (
              <button
                type="button"
                className="user-dropdown-item"
                role="menuitem"
                onClick={handleOpenChangePassword}
              >
                <span className="user-dropdown-item-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <span className="user-dropdown-item-text">Đổi mật khẩu</span>
              </button>
            ) : (
              <div className="user-dropdown-item disabled-hint" title="Tài khoản đăng nhập qua Google không dùng mật khẩu cục bộ">
                <span className="user-dropdown-item-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
                <span className="user-dropdown-item-text">Tài khoản Google</span>
              </div>
            )}

            {user.role === "ADMIN" && (
              <button
                type="button"
                className="user-dropdown-item"
                role="menuitem"
                onClick={handleNavigateAdmin}
              >
                <span className="user-dropdown-item-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <span className="user-dropdown-item-text">Trang quản trị</span>
              </button>
            )}
          </div>

          <div className="user-dropdown-divider" />

          {/* Logout Action */}
          <button
            type="button"
            className="user-dropdown-item user-dropdown-logout"
            role="menuitem"
            onClick={handleLogout}
            disabled={logout.isPending}
          >
            <span className="user-dropdown-item-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            <span className="user-dropdown-item-text">
              {logout.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
