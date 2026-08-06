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
          <span>ZenLiving</span>
          <small>Admin Portal</small>
        </Link>
        <nav className="nav-links desktop-nav admin-nav-links" aria-label="Admin navigation">
          <NavLink to="/admin">Tổng quan</NavLink>
          <NavLink to="/admin/products">Sản phẩm</NavLink>
          <NavLink to="/admin/categories">Danh mục</NavLink>
          <NavLink to="/admin/orders">Đơn hàng</NavLink>
          <NavLink to="/">Xem Cửa hàng</NavLink>
        </nav>
        <div className="admin-header-actions">
          {user?.fullName && <span className="admin-user-label">{user.fullName}</span>}
          <button type="button" className="secondary-action admin-logout-button" style={{ background: "#1e293b", color: "#ffffff", borderColor: "#334155" }} onClick={() => logout.mutate()} disabled={status === "loading"}>
            Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
};
