import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "../components/feedback/Loading.js";
import { useAuthStore } from "../features/auth/store/authStore.js";

export const ProtectedRoute = () => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  if (status === "idle" || status === "loading") {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
