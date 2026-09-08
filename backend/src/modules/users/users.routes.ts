import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { authRateLimiter } from "../../common/middleware/rateLimits.js";
import { changePasswordController, getCurrentUser } from "./users.controller.js";

export const usersRoutes = Router();

usersRoutes.get("/me", authenticate, getCurrentUser);
usersRoutes.put("/me/password", authenticate, authRateLimiter(), changePasswordController);

