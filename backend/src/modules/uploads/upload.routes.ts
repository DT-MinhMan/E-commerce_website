import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { requireRoles } from "../../common/middleware/requireRoles.js";
import { uploadCategoryImageController, uploadProductImageController } from "./upload.controller.js";

export const adminUploadRoutes = Router();

adminUploadRoutes.use(authenticate, requireRoles("ADMIN"));
adminUploadRoutes.post("/product-image", uploadProductImageController);
adminUploadRoutes.post("/category-image", uploadCategoryImageController);
