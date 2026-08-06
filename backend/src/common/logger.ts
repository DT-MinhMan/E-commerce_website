import type { AppConfig, LogLevel } from "../config/env.js";

export type LoggerLevel = Exclude<LogLevel, "silent">;

export interface LogFields {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  orderId?: string;
  paymentId?: string;
  providerEventId?: string;
  errorCode?: string;
  [key: string]: string | number | boolean | undefined;
}

const levelPriority: Record<LogLevel, number> = {
  silent: 99,
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const shouldLog = (configuredLevel: LogLevel, messageLevel: LoggerLevel): boolean =>
  configuredLevel !== "silent" && levelPriority[messageLevel] >= levelPriority[configuredLevel];

const write = (level: LoggerLevel, entry: Record<string, unknown>): void => {
  const serialized = JSON.stringify(entry);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
};

export const log = (config: Pick<AppConfig, "logLevel">, level: LoggerLevel, message: string, fields: LogFields = {}): void => {
  if (!shouldLog(config.logLevel, level)) {
    return;
  }

  write(level, {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields
  });
};

export const logger = {
  debug: (config: Pick<AppConfig, "logLevel">, message: string, fields?: LogFields): void => log(config, "debug", message, fields),
  info: (config: Pick<AppConfig, "logLevel">, message: string, fields?: LogFields): void => log(config, "info", message, fields),
  warn: (config: Pick<AppConfig, "logLevel">, message: string, fields?: LogFields): void => log(config, "warn", message, fields),
  error: (config: Pick<AppConfig, "logLevel">, message: string, fields?: LogFields): void => log(config, "error", message, fields)
};
