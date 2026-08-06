import dotenv from "dotenv";

dotenv.config();

export type NodeEnv = "development" | "test" | "production";
export type LogLevel = "silent" | "debug" | "info" | "warn" | "error";

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  mongodbUri: string;
  clientUrl: string;
  logLevel: LogLevel;
  jwtAccessSecret: string;
  jwtAccessExpiresIn: string;
  refreshTokenExpiresInDays: number;
  cookieSecure: boolean;
  cookieSameSite: "strict" | "lax" | "none";
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeSuccessUrl?: string;
  stripeCancelUrl?: string;
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  cloudinaryApiSecret?: string;
  cloudinaryProductFolder: string;
}

let cachedConfig: AppConfig | null = null;

const requiredKeys = ["NODE_ENV", "PORT", "MONGODB_URI", "CLIENT_URL", "LOG_LEVEL", "JWT_ACCESS_SECRET"] as const;

const isNodeEnv = (value: string): value is NodeEnv =>
  value === "development" || value === "test" || value === "production";

const isLogLevel = (value: string): value is LogLevel =>
  value === "silent" || value === "debug" || value === "info" || value === "warn" || value === "error";

const isCookieSameSite = (value: string): value is AppConfig["cookieSameSite"] =>
  value === "strict" || value === "lax" || value === "none";

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("COOKIE_SECURE must be true or false");
};

export const validateEnv = (env: NodeJS.ProcessEnv = process.env): AppConfig => {
  const missingKeys = requiredKeys.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(", ")}`);
  }

  const nodeEnv = env.NODE_ENV as string;
  const logLevel = env.LOG_LEVEL as string;
  const port = Number(env.PORT);
  const refreshTokenExpiresInDays = Number(env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? "7");
  const cookieSameSite = env.COOKIE_SAME_SITE ?? "lax";

  if (!isNodeEnv(nodeEnv)) {
    throw new Error("NODE_ENV must be one of development, test, production");
  }

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  if (!isLogLevel(logLevel)) {
    throw new Error("LOG_LEVEL must be one of silent, debug, info, warn, error");
  }

  if (!Number.isInteger(refreshTokenExpiresInDays) || refreshTokenExpiresInDays <= 0) {
    throw new Error("REFRESH_TOKEN_EXPIRES_IN_DAYS must be a positive integer");
  }

  if (!isCookieSameSite(cookieSameSite)) {
    throw new Error("COOKIE_SAME_SITE must be one of strict, lax, none");
  }

  const cookieSecure = parseBoolean(env.COOKIE_SECURE, nodeEnv === "production");
  const stripeMissingKeys = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_SUCCESS_URL", "STRIPE_CANCEL_URL"].filter(
    (key) => !env[key]
  );

  if (nodeEnv !== "test" && stripeMissingKeys.length > 0) {
    throw new Error(`Missing required Stripe environment variables: ${stripeMissingKeys.join(", ")}`);
  }

  if (env.STRIPE_SUCCESS_URL && !env.STRIPE_SUCCESS_URL.includes("{ORDER_ID}")) {
    throw new Error("STRIPE_SUCCESS_URL must include {ORDER_ID}");
  }

  if (env.STRIPE_CANCEL_URL && !env.STRIPE_CANCEL_URL.includes("{ORDER_ID}")) {
    throw new Error("STRIPE_CANCEL_URL must include {ORDER_ID}");
  }

  return {
    nodeEnv,
    port,
    mongodbUri: env.MONGODB_URI as string,
    clientUrl: env.CLIENT_URL as string,
    logLevel,
    jwtAccessSecret: env.JWT_ACCESS_SECRET as string,
    jwtAccessExpiresIn: env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshTokenExpiresInDays,
    cookieSecure,
    cookieSameSite,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    stripeSuccessUrl: env.STRIPE_SUCCESS_URL,
    stripeCancelUrl: env.STRIPE_CANCEL_URL,
    cloudinaryCloudName: env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: env.CLOUDINARY_API_SECRET,
    cloudinaryProductFolder: env.CLOUDINARY_PRODUCT_FOLDER ?? "ecommerce/products"
  };
};

export const getConfig = (): AppConfig => {
  cachedConfig ??= validateEnv();
  return cachedConfig;
};
