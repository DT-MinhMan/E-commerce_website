import { Router, type NextFunction, type Request, type Response } from "express";
import { successResponse } from "../../common/utils/apiResponse.js";
import { handleStripeWebhook } from "./stripe.webhook.service.js";

export const stripeWebhookRoutes = Router();

stripeWebhookRoutes.post("/", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await handleStripeWebhook(req.body as Buffer, req.get("stripe-signature"), { requestId: req.requestId });
    res.status(200).json(successResponse({ received: true }));
  } catch (error) {
    next(error);
  }
});
