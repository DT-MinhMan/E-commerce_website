import type { NextFunction, Request, Response } from "express";
import type { AppConfig } from "../../config/env.js";

export const requestLogger =
  (config: AppConfig) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
      if (config.logLevel === "silent") {
        return;
      }

      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      console.info(
        JSON.stringify({
          level: "info",
          requestId: req.requestId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Math.round(durationMs)
        })
      );
    });

    next();
  };
