import type { NextFunction, Request, Response } from "express";
import { successResponse } from "../../common/utils/apiResponse.js";
import {
  createCategory,
  createProduct,
  deactivateCategory,
  deactivateProduct,
  getPublicProductBySlug,
  listAdminCategories,
  listAdminProducts,
  listPublicCategories,
  listPublicProducts,
  updateCategory,
  updateProduct
} from "./catalog.service.js";
import {
  parseCategoryCreateInput,
  parseCategoryListQuery,
  parseCategoryUpdateInput,
  parseObjectIdParam,
  parseProductCreateInput,
  parseProductListQuery,
  parseProductUpdateInput,
  parseSlugParam
} from "./catalog.validation.js";

const routeParam = (value: string | string[] | undefined): string | undefined => (typeof value === "string" ? value : undefined);

export const listPublicCategoriesController = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse({ categories: await listPublicCategories() }));
  } catch (error) {
    next(error);
  }
};

export const listAdminCategoriesController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json(successResponse({ categories: await listAdminCategories(parseCategoryListQuery(req.query)) }));
  } catch (error) {
    next(error);
  }
};

export const createCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(successResponse({ category: await createCategory(parseCategoryCreateInput(req.body)) }));
  } catch (error) {
    next(error);
  }
};

export const updateCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseObjectIdParam(routeParam(req.params.id));
    res.status(200).json(successResponse({ category: await updateCategory(id, parseCategoryUpdateInput(req.body)) }));
  } catch (error) {
    next(error);
  }
};

export const deactivateCategoryController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseObjectIdParam(routeParam(req.params.id));
    res.status(200).json(successResponse({ category: await deactivateCategory(id) }));
  } catch (error) {
    next(error);
  }
};

export const listPublicProductsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await listPublicProducts(parseProductListQuery(req.query));
    res.status(200).json(successResponse({ products: result.products }, result.meta));
  } catch (error) {
    next(error);
  }
};

export const getPublicProductController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const slug = parseSlugParam(routeParam(req.params.slug));
    res.status(200).json(successResponse({ product: await getPublicProductBySlug(slug) }));
  } catch (error) {
    next(error);
  }
};

export const listAdminProductsController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await listAdminProducts(parseProductListQuery(req.query, true));
    res.status(200).json(successResponse({ products: result.products }, result.meta));
  } catch (error) {
    next(error);
  }
};

export const createProductController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(201).json(successResponse({ product: await createProduct(parseProductCreateInput(req.body)) }));
  } catch (error) {
    next(error);
  }
};

export const updateProductController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseObjectIdParam(routeParam(req.params.id));
    res.status(200).json(successResponse({ product: await updateProduct(id, parseProductUpdateInput(req.body)) }));
  } catch (error) {
    next(error);
  }
};

export const deactivateProductController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = parseObjectIdParam(routeParam(req.params.id));
    res.status(200).json(successResponse({ product: await deactivateProduct(id) }));
  } catch (error) {
    next(error);
  }
};
