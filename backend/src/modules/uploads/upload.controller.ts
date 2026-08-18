import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/apiResponse.js";
import { uploadCategoryImageToCloudinary, uploadProductImageToCloudinary } from "./cloudinary.service.js";
import { parseProductImageUploadInput } from "./upload.validation.js";

export const uploadProductImageController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const image = await uploadProductImageToCloudinary(parseProductImageUploadInput(req.body));
    res.status(201).json(successResponse({ image }));
  } catch (error) {
    next(error);
  }
};

export const uploadCategoryImageController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const image = await uploadCategoryImageToCloudinary(parseProductImageUploadInput(req.body));
    res.status(201).json(successResponse({ image }));
  } catch (error) {
    next(error);
  }
};
