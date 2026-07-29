import type { ErrorRequestHandler } from "express";
import type { AppConfig } from "../../config/env.js";
import { AppError } from "../errors/AppError.js";
import type { ErrorResponse } from "../utils/apiResponse.js";

export const errorHandler =
  (config: AppConfig): ErrorRequestHandler =>
  (error, req, res, _next): void => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred", null, false);

    if (!appError.isOperational && config.logLevel !== "silent") {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(
        JSON.stringify({
          level: "error",
          requestId: req.requestId,
          message,
          stack: config.nodeEnv === "development" && error instanceof Error ? error.stack : undefined
        })
      );
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details
      },
      requestId: req.requestId
    };

    if (config.nodeEnv === "development" && error instanceof Error) {
      response.error.stack = error.stack;
    }

    res.status(appError.statusCode).json(response);
  };
