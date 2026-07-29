import { getDatabaseStatus } from "../../config/database.js";
import type { AppConfig } from "../../config/env.js";

export interface HealthStatus {
  status: "ok";
  database: "connected" | "disconnected";
  environment: AppConfig["nodeEnv"];
  timestamp: string;
}

export const getHealthStatus = (config: AppConfig): HealthStatus => ({
  status: "ok",
  database: getDatabaseStatus(),
  environment: config.nodeEnv,
  timestamp: new Date().toISOString()
});
