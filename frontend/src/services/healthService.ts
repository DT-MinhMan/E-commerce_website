import { apiClient } from "./apiClient.js";
import type { HealthStatus } from "../types/health.js";

interface HealthResponse {
  success: true;
  data: HealthStatus;
  meta: unknown;
}

export const getHealth = async (): Promise<HealthStatus> => {
  const response = await apiClient.get<HealthResponse>("/health");
  return response.data.data;
};
