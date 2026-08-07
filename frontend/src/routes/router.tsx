import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout.js";
import { AccountPage } from "../pages/account/AccountPage.js";
import { LoginPage } from "../pages/account/LoginPage.js";
import { OrderDetailPage } from "../pages/account/OrderDetailPage.js";
import { OrderHistoryPage } from "../pages/account/OrderHistoryPage.js";
import { PayOrderPage } from "../pages/account/PayOrderPage.js";
import { PaymentCancelPage } from "../pages/account/PaymentCancelPage.js";
import { PaymentSuccessPage } from "../pages/account/PaymentSuccessPage.js";
import { RegisterPage } from "../pages/account/RegisterPage.js";
import { ErrorPage } from "../pages/ErrorPage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";
import { CartPage } from "../pages/storefront/CartPage.js";
import { CheckoutPage } from "../pages/storefront/CheckoutPage.js";
import { HealthPage } from "../pages/storefront/HealthPage.js";
import { HomePage } from "../pages/storefront/HomePage.js";
import { InspirationPage } from "../pages/storefront/InspirationPage.js";
import { ProductDetailPage } from "../pages/storefront/ProductDetailPage.js";
import { ProductListPage } from "../pages/storefront/ProductListPage.js";
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
        path: "inspiration",
        element: <InspirationPage />
      },
      {
        path: "goc-cam-hung",
        element: <InspirationPage />
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
            lazy: async () => ({ Component: (await import("../pages/admin/AdminPage.js")).AdminPage })
          },
          {
            path: "admin/categories",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminCategoriesPage.js")).AdminCategoriesPage })
          },
          {
            path: "admin/categories/new",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminCategoryFormPage.js")).AdminCategoryFormPage })
          },
          {
            path: "admin/categories/:categoryId/edit",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminCategoryFormPage.js")).AdminCategoryFormPage })
          },
          {
            path: "admin/products",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminProductsPage.js")).AdminProductsPage })
          },
          {
            path: "admin/products/new",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminProductFormPage.js")).AdminProductFormPage })
          },
          {
            path: "admin/products/:productId/edit",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminProductFormPage.js")).AdminProductFormPage })
          },
          {
            path: "admin/orders",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminOrdersPage.js")).AdminOrdersPage })
          },
          {
            path: "admin/orders/:orderId",
            lazy: async () => ({ Component: (await import("../pages/admin/AdminOrderDetailPage.js")).AdminOrderDetailPage })
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
