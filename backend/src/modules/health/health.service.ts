import { getDatabaseStatus } from "../../config/database.js";
import type { AppConfig } from "../../config/env.js";

export interface HealthStatus {
  status: "ok";
  environment: AppConfig["nodeEnv"];
  timestamp: string;
}

export interface ReadinessStatus {
  status: "ready" | "not_ready";
  database: "connected" | "disconnected";
  dependencies: {
    mongodb: "ready" | "unavailable";
    stripeConfig: "configured" | "missing";
  };
  environment: AppConfig["nodeEnv"];
  timestamp: string;
}

export const getHealthStatus = (config: AppConfig): HealthStatus => ({
  status: "ok",
  environment: config.nodeEnv,
  timestamp: new Date().toISOString()
});

export const getReadinessStatus = (config: AppConfig): ReadinessStatus => {
  const database = getDatabaseStatus();
  const stripeConfigured =
    config.nodeEnv === "test" ||
    Boolean(config.stripeSecretKey && config.stripeWebhookSecret && config.stripeSuccessUrl && config.stripeCancelUrl);
  const ready = database === "connected" && stripeConfigured;

  return {
    status: ready ? "ready" : "not_ready",
    database,
    dependencies: {
      mongodb: database === "connected" ? "ready" : "unavailable",
      stripeConfig: stripeConfigured ? "configured" : "missing"
    },
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  };
};
