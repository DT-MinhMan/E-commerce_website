import { Navigate, Outlet } from "react-router-dom";
import { Loading } from "../components/Loading.js";
import { useAuthStore } from "../store/authStore.js";

export const AdminRoute = () => {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === "idle" || status === "loading") {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
};
