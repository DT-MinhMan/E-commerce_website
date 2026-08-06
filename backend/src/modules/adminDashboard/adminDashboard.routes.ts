import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireRoles } from "../../common/middleware/requireRoles.js";
import { getAdminDashboardSummaryController } from "./adminDashboard.controller.js";

export const adminDashboardRoutes = Router();

adminDashboardRoutes.use(authenticate, requireRoles("ADMIN"));
adminDashboardRoutes.get("/summary", getAdminDashboardSummaryController);
