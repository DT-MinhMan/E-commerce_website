import { Router } from "express";
import { authRateLimiter, refreshRateLimiter } from "../../common/middleware/rateLimits.js";
import { requireConfiguredAllowedOrigin } from "../../common/middleware/requireAllowedOrigin.js";
import { loginController, logoutController, refreshController, registerController } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimiter(), registerController);
authRoutes.post("/login", authRateLimiter(), loginController);
authRoutes.post("/refresh", refreshRateLimiter(), requireConfiguredAllowedOrigin, refreshController);
authRoutes.post("/logout", refreshRateLimiter(), requireConfiguredAllowedOrigin, logoutController);
