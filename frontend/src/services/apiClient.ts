import axios, { AxiosError } from "axios";
import { config } from "../config/env.js";

export interface ApiError {
  message: string;
  code?: string;
  requestId?: string;
}

interface ErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
  requestId?: string;
}

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ErrorPayload>) => {
    const normalizedError: ApiError = {
      message: error.response?.data?.error?.message ?? error.message ?? "Request failed",
      code: error.response?.data?.error?.code,
      requestId: error.response?.data?.requestId
    };

    return Promise.reject(normalizedError);
  }
);
