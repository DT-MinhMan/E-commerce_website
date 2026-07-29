import type { Request, Response } from "express";
import { getConfig } from "../../config/env.js";
import { successResponse } from "../../common/utils/apiResponse.js";
import { getHealthStatus } from "./health.service.js";

export const getHealth = (_req: Request, res: Response): void => {
  const health = getHealthStatus(getConfig());
  res.status(200).json(successResponse(health));
};
