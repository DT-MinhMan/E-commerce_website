import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireRoles } from "../../common/middleware/requireRoles.js";
import { checkoutController, getOrderByIdController, listOrdersController } from "./order.controller.js";

export const orderRoutes = Router();

orderRoutes.use(authenticate, requireRoles("CUSTOMER"));
orderRoutes.post("/checkout", checkoutController);
orderRoutes.get("/", listOrdersController);
orderRoutes.get("/:orderId", getOrderByIdController);
