import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.js";
import { AccountPage } from "../pages/AccountPage.js";
import { AdminPage } from "../pages/AdminPage.js";
import { CartPage } from "../pages/CartPage.js";
import { ErrorPage } from "../pages/ErrorPage.js";
import { HealthPage } from "../pages/HealthPage.js";
import { HomePage } from "../pages/HomePage.js";
import { LoginPage } from "../pages/LoginPage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";
import { CheckoutPage } from "../pages/CheckoutPage.js";
import { OrderDetailPage } from "../pages/OrderDetailPage.js";
import { OrderHistoryPage } from "../pages/OrderHistoryPage.js";
import { PayOrderPage } from "../pages/PayOrderPage.js";
import { PaymentCancelPage } from "../pages/PaymentCancelPage.js";
import { PaymentSuccessPage } from "../pages/PaymentSuccessPage.js";
import { ProductDetailPage } from "../pages/ProductDetailPage.js";
import { ProductListPage } from "../pages/ProductListPage.js";
import { RegisterPage } from "../pages/RegisterPage.js";
import { AdminRoute } from "./AdminRoute.js";
import { ProtectedRoute } from "./ProtectedRoute.js";

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
        path: "products",
        element: <ProductListPage />
      },
      {
        path: "products/:slug",
        element: <ProductDetailPage />
      },
      {
        path: "login",
        element: <LoginPage />
      },
      {
        path: "register",
        element: <RegisterPage />
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: "account",
            element: <AccountPage />
          },
          {
            path: "cart",
            element: <CartPage />
          },
          {
            path: "checkout",
            element: <CheckoutPage />
          },
          {
            path: "orders",
            element: <OrderHistoryPage />
          },
          {
            path: "orders/:orderId",
            element: <OrderDetailPage />
          },
          {
            path: "orders/:orderId/pay",
            element: <PayOrderPage />
          },
          {
            path: "payment/success",
            element: <PaymentSuccessPage />
          },
          {
            path: "payment/cancel",
            element: <PaymentCancelPage />
          }
        ]
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "admin",
            element: <AdminPage />
          }
        ]
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
