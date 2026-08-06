import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

const requestIdPattern = /^[a-zA-Z0-9._:-]{1,128}$/;

const getRequestId = (value: string | undefined): string => {
  const trimmed = value?.trim();
  return trimmed && requestIdPattern.test(trimmed) ? trimmed : randomUUID();
};

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = getRequestId(req.header("x-request-id"));
  res.setHeader("x-request-id", req.requestId);
  next();
};
