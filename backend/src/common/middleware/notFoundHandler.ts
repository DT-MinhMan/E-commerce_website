import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(404, "ROUTE_NOT_FOUND", `Route ${req.method} ${req.originalUrl} not found`));
};
