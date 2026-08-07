import { Link, NavLink } from "react-router-dom";
import { useLogout } from "../../features/auth/hooks/useAuthQueries.js";
import { useAuthStore } from "../../features/auth/store/authStore.js";

export const AdminHeader = () => {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();

  return (
    <header className="app-header admin-header">
      <div className="header-bar admin-header-bar">
        <Link className="brand-mark admin-brand-mark" to="/admin" aria-label="ZenLiving admin dashboard">
          <div className="admin-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="admin-brand-text">
            <span className="admin-brand-title">ZenLiving</span>
            <span className="admin-brand-badge">Admin Portal</span>
          </div>
        </Link>

        <nav className="nav-links desktop-nav admin-nav-links" aria-label="Admin navigation">
          <NavLink to="/admin" end aria-label="Dashboard" className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Tổng quan</span>
          </NavLink>

          <NavLink to="/admin/products" aria-label="Products" className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Sản phẩm</span>
          </NavLink>

          <NavLink to="/admin/categories" aria-label="Categories" className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span>Danh mục</span>
          </NavLink>

          <NavLink to="/admin/orders" aria-label="Orders" className={({ isActive }) => (isActive ? "admin-nav-item active" : "admin-nav-item")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Đơn hàng</span>
          </NavLink>

          <Link to="/" aria-label="Storefront" className="admin-nav-item admin-store-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Xem Cửa hàng</span>
          </Link>
        </nav>

        <div className="admin-header-actions">
          {user?.fullName && (
            <div className="admin-user-badge">
              <div className="admin-user-avatar">{user.fullName.charAt(0).toUpperCase()}</div>
              <span className="admin-user-label">{user.fullName}</span>
            </div>
          )}
          <button
            type="button"
            className="admin-logout-button"
            aria-label="Log out"
            onClick={() => logout.mutate()}
            disabled={status === "loading"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};

