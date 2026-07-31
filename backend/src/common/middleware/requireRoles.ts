import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import type { UserRole } from "../../database/enums.js";

export const requireRoles =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      next(new AppError(401, "AUTH_TOKEN_MISSING", "Access token is missing"));
      return;
    }

    if (!roles.includes(req.currentUser.role)) {
      next(new AppError(403, "AUTH_FORBIDDEN", "You do not have permission to access this resource"));
      return;
    }

    next();
  };
