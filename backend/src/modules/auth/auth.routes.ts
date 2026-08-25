import { Router } from "express";
import { authRateLimiter, otpRateLimiter, refreshRateLimiter } from "../../common/middleware/rateLimits.js";
import { requireConfiguredAllowedOrigin } from "../../common/middleware/requireAllowedOrigin.js";
import {
  googleLoginController,
  loginController,
  logoutController,
  refreshController,
  registerController,
  resendOtpController,
  verifyEmailController
} from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", authRateLimiter(), registerController);
authRoutes.post("/verify-email", otpRateLimiter(), verifyEmailController);
authRoutes.post("/resend-otp", otpRateLimiter(), resendOtpController);
authRoutes.post("/google", authRateLimiter(), googleLoginController);
authRoutes.post("/login", authRateLimiter(), loginController);
authRoutes.post("/refresh", refreshRateLimiter(), requireConfiguredAllowedOrigin, refreshController);
authRoutes.post("/logout", refreshRateLimiter(), requireConfiguredAllowedOrigin, logoutController);
