import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { getConfig } from "../../config/env.js";
import { verifyAccessToken } from "../../modules/auth/tokens.js";

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authorization = req.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    next(new AppError(401, "AUTH_TOKEN_MISSING", "Access token is missing"));
    return;
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    next(new AppError(401, "AUTH_TOKEN_MISSING", "Access token is missing"));
    return;
  }

  try {
    const payload = verifyAccessToken(getConfig(), token);
    req.currentUser = {
      userId: payload.sub,
      role: payload.role
    };
    next();
  } catch {
    next(new AppError(401, "AUTH_ACCESS_TOKEN_INVALID", "Access token is invalid"));
  }
};
