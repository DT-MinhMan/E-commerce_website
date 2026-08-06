import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireRoles } from "../../common/middleware/requireRoles.js";
import {
  createCategoryController,
  createProductController,
  deactivateCategoryController,
  deactivateProductController,
  getAdminProductController,
  getPublicProductController,
  listAdminCategoriesController,
  listAdminProductsController,
  listPublicCategoriesController,
  listPublicProductsController,
  updateCategoryController,
  updateProductController,
  updateProductStatusController,
  updateProductStockController
} from "./catalog.controller.js";

export const publicCategoryRoutes = Router();
export const publicProductRoutes = Router();
export const adminCategoryRoutes = Router();
export const adminProductRoutes = Router();

publicCategoryRoutes.get("/", listPublicCategoriesController);

publicProductRoutes.get("/", listPublicProductsController);
publicProductRoutes.get("/:slug", getPublicProductController);

adminCategoryRoutes.use(authenticate, requireRoles("ADMIN"));
adminCategoryRoutes.get("/", listAdminCategoriesController);
adminCategoryRoutes.post("/", createCategoryController);
adminCategoryRoutes.patch("/:id", updateCategoryController);
adminCategoryRoutes.delete("/:id", deactivateCategoryController);

adminProductRoutes.use(authenticate, requireRoles("ADMIN"));
adminProductRoutes.get("/", listAdminProductsController);
adminProductRoutes.post("/", createProductController);
adminProductRoutes.get("/:id", getAdminProductController);
adminProductRoutes.patch("/:id/stock", updateProductStockController);
adminProductRoutes.patch("/:id/status", updateProductStatusController);
adminProductRoutes.patch("/:id", updateProductController);
adminProductRoutes.delete("/:id", deactivateProductController);
