import mongoose from "mongoose";
import { logger } from "../common/logger.js";
import { getConfig, type AppConfig } from "./env.js";

export const connectDatabase = async (mongodbUri: string, config: Pick<AppConfig, "logLevel"> = getConfig()): Promise<void> => {
  try {
    await mongoose.connect(mongodbUri);
    logger.info(config, "MongoDB connected");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB connection error";
    logger.error(config, "MongoDB connection failed", { error: message });
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};

export const getDatabaseStatus = (): "connected" | "disconnected" => {
  return mongoose.connection.readyState === 1 ? "connected" : "disconnected";
};
