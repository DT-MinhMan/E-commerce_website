import cors from "cors";
import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./common/middleware/errorHandler.js";
import { notFoundHandler } from "./common/middleware/notFoundHandler.js";
import { requestIdMiddleware } from "./common/middleware/requestIdMiddleware.js";
import { requestLogger } from "./common/middleware/requestLogger.js";
import { getConfig, type AppConfig } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { cartRoutes } from "./modules/cart/cart.routes.js";
import { adminCategoryRoutes, adminProductRoutes, publicCategoryRoutes, publicProductRoutes } from "./modules/catalog/catalog.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";

export const createApp = (config: AppConfig = getConfig()): Express => {
  const app = express();

  app.use(requestIdMiddleware);
  app.use(helmet());
  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false
    })
  );
  app.use(requestLogger(config));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec(config)));
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/admin/categories", adminCategoryRoutes);
  app.use("/api/v1/admin/products", adminProductRoutes);
  app.use("/api/v1/cart", cartRoutes);
  app.use("/api/v1/categories", publicCategoryRoutes);
  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/products", publicProductRoutes);
  app.use("/api/v1/users", usersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler(config));

  return app;
};

export const app = createApp();
