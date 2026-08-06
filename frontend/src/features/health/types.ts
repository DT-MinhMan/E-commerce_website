export interface HealthStatus {
  status: "ok";
  database: "connected" | "disconnected";
  environment: string;
  timestamp: string;
}
