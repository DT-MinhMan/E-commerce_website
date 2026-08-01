import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireRoles } from "../../common/middleware/requireRoles.js";
import { createCheckoutSessionController, getPaymentStatusByOrderController } from "./payment.controller.js";

export const paymentRoutes = Router();

paymentRoutes.use(authenticate, requireRoles("CUSTOMER"));
paymentRoutes.post("/checkout-session", createCheckoutSessionController);
paymentRoutes.get("/orders/:orderId", getPaymentStatusByOrderController);
