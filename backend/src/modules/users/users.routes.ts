import { Router } from "express";
import { authenticate } from "../../common/middleware/authenticate.js";
import { changePasswordController, getCurrentUser } from "./users.controller.js";

export const usersRoutes = Router();

usersRoutes.get("/me", authenticate, getCurrentUser);
usersRoutes.put("/me/password", authenticate, changePasswordController);
