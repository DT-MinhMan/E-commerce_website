import type { NextFunction, Request, Response } from "express";
import { logger } from "../logger.js";
import type { AppConfig } from "../../config/env.js";

export const requestLogger =
  (config: AppConfig) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      logger.info(config, "Request completed", {
        requestId: req.requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs),
        userId: req.currentUser?.userId
      });
    });

    next();
  };
