import { Outlet } from "react-router-dom";
import { AdminHeader } from "../components/layout/AdminHeader.js";
import { StorefrontFooter } from "../components/layout/StorefrontFooter.js";
import { StorefrontHeader } from "../components/layout/StorefrontHeader.js";
import { useAuthStore } from "../features/auth/store/authStore.js";
import { useCategoriesQuery } from "../features/catalog/hooks/useCatalogQueries.js";

export const AppLayout = () => {
  const categoriesQuery = useCategoriesQuery();
  const categories = categoriesQuery.data ?? [];
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="app-shell">
      {isAdmin ? <AdminHeader /> : <StorefrontHeader categories={categories} />}
      <main className="app-main">
        <Outlet />
      </main>
      {!isAdmin && <StorefrontFooter categories={categories} />}
    </div>
  );
};
