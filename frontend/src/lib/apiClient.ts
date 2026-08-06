import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { config } from "../config/env.js";
import type { AuthSession } from "../features/auth/types.js";

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

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface AuthHandlers {
  onSessionRefreshed?: (session: AuthSession) => void;
  onSessionExpired?: () => void;
}

interface AuthResponse {
  success: true;
  data: AuthSession;
  meta: unknown;
}

let accessToken: string | null = null;
let refreshPromise: Promise<AuthSession> | null = null;
let authHandlers: AuthHandlers = {};

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 8000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const configureAuthHandlers = (handlers: AuthHandlers): void => {
  authHandlers = handlers;
};

const shouldAttemptRefresh = (error: AxiosError<ErrorPayload>, request: RetriableRequestConfig): boolean => {
  const url = request.url ?? "";

  return (
    error.response?.status === 401 &&
    !request._retry &&
    !url.includes("/auth/refresh") &&
    !url.includes("/auth/login") &&
    !url.includes("/auth/register") &&
    !url.includes("/auth/logout")
  );
};

const refreshSession = async (): Promise<AuthSession> => {
  refreshPromise ??= apiClient
    .post<AuthResponse>("/auth/refresh")
    .then((response) => {
      const session = response.data.data;
      setAccessToken(session.accessToken);
      authHandlers.onSessionRefreshed?.(session);
      return session;
    })
    .catch((error) => {
      setAccessToken(null);
      authHandlers.onSessionExpired?.();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

apiClient.interceptors.request.use((request) => {
  request.headers["x-request-id"] ??= globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  if (accessToken) {
    request.headers.Authorization = `Bearer ${accessToken}`;
  }

  return request;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorPayload>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (originalRequest && shouldAttemptRefresh(error, originalRequest)) {
      originalRequest._retry = true;
      const session = await refreshSession();
      originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
      return apiClient(originalRequest);
    }

    const normalizedError: ApiError = {
      message: error.response?.data?.error?.message ?? error.message ?? "Request failed",
      code: error.response?.data?.error?.code,
      requestId: error.response?.data?.requestId
    };

    return Promise.reject(normalizedError);
  }
);
