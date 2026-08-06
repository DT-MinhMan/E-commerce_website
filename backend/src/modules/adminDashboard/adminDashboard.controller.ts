import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/apiResponse.js";
import { getAdminDashboardSummary } from "./adminDashboard.service.js";

export const getAdminDashboardSummaryController = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse({ summary: await getAdminDashboardSummary() }));
  } catch (error) {
    next(error);
  }
};
