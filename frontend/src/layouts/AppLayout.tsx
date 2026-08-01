import { NavLink, Outlet } from "react-router-dom";
import { useLogout } from "../hooks/useAuthQueries.js";
import { useCartQuery } from "../hooks/useCartQueries.js";
import { useAuthStore } from "../store/authStore.js";

export const AppLayout = () => {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const cartQuery = useCartQuery();
  const cartCount = cartQuery.data?.itemCount ?? 0;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Phase 5</p>
          <h1>MERN E-commerce Platform</h1>
        </div>
        <nav className="nav-links" aria-label="Primary navigation">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          {user ? (
            <>
              <NavLink to="/cart">Cart{cartCount > 0 ? ` (${cartCount})` : ""}</NavLink>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink to="/account">Account</NavLink>
              {user.role === "ADMIN" && <NavLink to="/admin">Admin</NavLink>}
              <button type="button" onClick={() => logout.mutate()} disabled={status === "loading"}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};
