import { Router } from "express";
import { getHealth, getReadiness } from "./health.controller.js";

export const healthRoutes = Router();
export const readinessRoutes = Router();

healthRoutes.get("/", getHealth);
readinessRoutes.get("/", getReadiness);
