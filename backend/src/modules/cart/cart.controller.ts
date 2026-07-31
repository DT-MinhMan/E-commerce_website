import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { successResponse } from "../../common/utils/apiResponse.js";
import { addCartItem, clearCart, getCurrentCart, removeCartItem, updateCartItem } from "./cart.service.js";
import { parseAddCartItemInput, parseCartQuantityInput, parseObjectIdParam } from "./cart.validation.js";

const currentUserId = (req: Request): string => {
  if (!req.currentUser) {
    throw new AppError(401, "AUTH_TOKEN_MISSING", "Access token is missing");
  }

  return req.currentUser.userId;
};

export const getCurrentCartController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse({ cart: await getCurrentCart(currentUserId(req)) }));
  } catch (error) {
    next(error);
  }
};

export const addCartItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse({ cart: await addCartItem(currentUserId(req), parseAddCartItemInput(req.body)) }));
  } catch (error) {
    next(error);
  }
};

export const updateCartItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseObjectIdParam(req.params.productId);
    res.status(200).json(successResponse({ cart: await updateCartItem(currentUserId(req), productId, parseCartQuantityInput(req.body)) }));
  } catch (error) {
    next(error);
  }
};

export const removeCartItemController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const productId = parseObjectIdParam(req.params.productId);
    res.status(200).json(successResponse({ cart: await removeCartItem(currentUserId(req), productId) }));
  } catch (error) {
    next(error);
  }
};

export const clearCartController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse({ cart: await clearCart(currentUserId(req)) }));
  } catch (error) {
    next(error);
  }
};
