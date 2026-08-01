import Stripe from "stripe";
import { AppError } from "../../common/errors/AppError.js";
import { getConfig, type AppConfig } from "../../config/env.js";

let stripeClient: Stripe | null = null;

const getStripeClient = (config: AppConfig = getConfig()): Stripe => {
  if (!config.stripeSecretKey) {
    throw new AppError(500, "STRIPE_CONFIG_MISSING", "Stripe is not configured");
  }

  stripeClient ??= new Stripe(config.stripeSecretKey);
  return stripeClient;
};

export const createStripeCheckoutSession = async (
  params: Stripe.Checkout.SessionCreateParams,
  idempotencyKey: string,
  config: AppConfig = getConfig()
): Promise<Stripe.Checkout.Session> =>
  getStripeClient(config).checkout.sessions.create(params, {
    idempotencyKey
  });

export const constructStripeWebhookEvent = (rawBody: Buffer, signature: string, config: AppConfig = getConfig()): Stripe.Event => {
  if (!config.stripeWebhookSecret) {
    throw new AppError(500, "STRIPE_CONFIG_MISSING", "Stripe webhook is not configured");
  }

  return getStripeClient(config).webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
};
