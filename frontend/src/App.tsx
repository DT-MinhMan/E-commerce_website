import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { useRefreshSession } from "./features/auth/hooks/useAuthQueries.js";
import { router } from "./routes/router.js";
import { useAuthStore } from "./features/auth/store/authStore.js";

export const App = () => {
  const status = useAuthStore((state) => state.status);
  const { mutate: refreshSession } = useRefreshSession();

  useEffect(() => {
    if (status === "idle") {
      refreshSession();
    }
  }, [refreshSession, status]);

  return <RouterProvider router={router} />;
};
