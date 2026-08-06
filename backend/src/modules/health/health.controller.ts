import type { Request, Response } from "express";
import { getConfig } from "../../config/env.js";
import { successResponse } from "../../common/utils/apiResponse.js";
import { getHealthStatus, getReadinessStatus } from "./health.service.js";

export const getHealth = (_req: Request, res: Response): void => {
  const health = getHealthStatus(getConfig());
  res.status(200).json(successResponse(health));
};

export const getReadiness = (_req: Request, res: Response): void => {
  const readiness = getReadinessStatus(getConfig());
  res.status(readiness.status === "ready" ? 200 : 503).json(successResponse(readiness));
};
