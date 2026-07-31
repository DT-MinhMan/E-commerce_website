import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { successResponse } from "../../common/utils/apiResponse.js";
import { getUserById } from "../auth/auth.service.js";

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.currentUser?.userId;

    if (!userId) {
      throw new AppError(401, "AUTH_TOKEN_MISSING", "Access token is missing");
    }

    const user = await getUserById(userId);
    res.status(200).json(successResponse({ user }));
  } catch (error) {
    next(error);
  }
};
