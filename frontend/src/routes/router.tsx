import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.js";
import { ErrorPage } from "../pages/ErrorPage.js";
import { HealthPage } from "../pages/HealthPage.js";
import { HomePage } from "../pages/HomePage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "health",
        element: <HealthPage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
