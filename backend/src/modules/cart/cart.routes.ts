import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireRoles } from "../../common/middleware/requireRoles.js";
import {
  addCartItemController,
  clearCartController,
  getCurrentCartController,
  removeCartItemController,
  updateCartItemController
} from "./cart.controller.js";

export const cartRoutes = Router();

cartRoutes.use(authenticate, requireRoles("CUSTOMER"));
cartRoutes.get("/", getCurrentCartController);
cartRoutes.post("/items", addCartItemController);
cartRoutes.patch("/items/:productId", updateCartItemController);
cartRoutes.delete("/items/:productId", removeCartItemController);
cartRoutes.delete("/", clearCartController);
