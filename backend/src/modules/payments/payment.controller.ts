import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { successResponse } from "../../common/utils/apiResponse.js";
import { createCheckoutSession, getPaymentStatusByOrder } from "./payment.service.js";
import { parseCheckoutSessionInput, parseOrderIdParam } from "./payment.validation.js";

const currentUserId = (req: Request): string => {
  if (!req.currentUser) {
    throw new AppError(401, "AUTH_TOKEN_MISSING", "Access token is missing");
  }

  return req.currentUser.userId;
};

export const createCheckoutSessionController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = parseCheckoutSessionInput(req.body);
    res.status(200).json(successResponse(await createCheckoutSession(currentUserId(req), input.orderId)));
  } catch (error) {
    next(error);
  }
};

export const getPaymentStatusByOrderController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse(await getPaymentStatusByOrder(currentUserId(req), parseOrderIdParam(req.params.orderId))));
  } catch (error) {
    next(error);
  }
};
