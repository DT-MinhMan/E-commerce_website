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
}

let cachedConfig: AppConfig | null = null;

const requiredKeys = ["NODE_ENV", "PORT", "MONGODB_URI", "CLIENT_URL", "LOG_LEVEL"] as const;

const isNodeEnv = (value: string): value is NodeEnv =>
  value === "development" || value === "test" || value === "production";

const isLogLevel = (value: string): value is LogLevel =>
  value === "silent" || value === "debug" || value === "info" || value === "warn" || value === "error";

export const validateEnv = (env: NodeJS.ProcessEnv = process.env): AppConfig => {
  const missingKeys = requiredKeys.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(", ")}`);
  }

  const nodeEnv = env.NODE_ENV as string;
  const logLevel = env.LOG_LEVEL as string;
  const port = Number(env.PORT);

  if (!isNodeEnv(nodeEnv)) {
    throw new Error("NODE_ENV must be one of development, test, production");
  }

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT must be a valid TCP port");
  }

  if (!isLogLevel(logLevel)) {
    throw new Error("LOG_LEVEL must be one of silent, debug, info, warn, error");
  }

  return {
    nodeEnv,
    port,
    mongodbUri: env.MONGODB_URI as string,
    clientUrl: env.CLIENT_URL as string,
    logLevel
  };
};

export const getConfig = (): AppConfig => {
  cachedConfig ??= validateEnv();
  return cachedConfig;
};
