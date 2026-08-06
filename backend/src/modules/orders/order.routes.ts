import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireRoles } from "../../common/middleware/requireRoles.js";
import {
  checkoutController,
  getAdminOrderByIdController,
  getOrderByIdController,
  listAdminOrdersController,
  listOrdersController,
  updateAdminOrderStatusController
} from "./order.controller.js";

export const orderRoutes = Router();
export const adminOrderRoutes = Router();

orderRoutes.use(authenticate, requireRoles("CUSTOMER"));
orderRoutes.post("/checkout", checkoutController);
orderRoutes.get("/", listOrdersController);
orderRoutes.get("/:orderId", getOrderByIdController);

adminOrderRoutes.use(authenticate, requireRoles("ADMIN"));
adminOrderRoutes.get("/", listAdminOrdersController);
adminOrderRoutes.get("/:orderId", getAdminOrderByIdController);
adminOrderRoutes.patch("/:orderId/status", updateAdminOrderStatusController);
