import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const headerRequestId = req.header("x-request-id");
  req.requestId = headerRequestId?.trim() || randomUUID();
  res.setHeader("x-request-id", req.requestId);
  next();
};
