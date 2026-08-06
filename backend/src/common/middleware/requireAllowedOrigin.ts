import type { NextFunction, Request, Response } from "express";
import { getConfig } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";

export const requireAllowedOrigin =
  (allowedOrigin: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const origin = req.get("origin");

    if (origin && origin !== allowedOrigin) {
      next(new AppError(403, "CSRF_ORIGIN_FORBIDDEN", "Request origin is not allowed"));
      return;
    }

    next();
  };

export const requireConfiguredAllowedOrigin = (req: Request, res: Response, next: NextFunction): void => {
  requireAllowedOrigin(getConfig().clientUrl)(req, res, next);
};
