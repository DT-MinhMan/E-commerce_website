import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { successResponse } from "../../common/utils/apiResponse.js";
import { checkout, getOrderById, listOrders } from "./order.service.js";
import { parseCheckoutInput, parseOrderIdParam, parseOrderListQuery } from "./order.validation.js";

const currentUserId = (req: Request): string => {
  if (!req.currentUser) {
    throw new AppError(401, "AUTH_TOKEN_MISSING", "Access token is missing");
  }

  return req.currentUser.userId;
};

export const checkoutController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(successResponse({ order: await checkout(currentUserId(req), parseCheckoutInput(req.body)) }));
  } catch (error) {
    next(error);
  }
};

export const listOrdersController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await listOrders(currentUserId(req), parseOrderListQuery(req.query));
    res.status(200).json(successResponse({ orders: result.orders }, result.meta));
  } catch (error) {
    next(error);
  }
};

export const getOrderByIdController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse({ order: await getOrderById(currentUserId(req), parseOrderIdParam(req.params.orderId)) }));
  } catch (error) {
    next(error);
  }
};
