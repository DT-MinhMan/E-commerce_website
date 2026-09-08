import { Router, type Request, type Response, type NextFunction } from "express";
import { handleMomoWebhook } from "./momo.webhook.service.js";

export const momoWebhookRoutes = Router();

momoWebhookRoutes.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await handleMomoWebhook(req.body, { requestId: req.requestId });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});
