import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../services/healthService.js";

export const healthQueryKey = ["health"] as const;

export const useHealthQuery = () =>
  useQuery({
    queryKey: healthQueryKey,
    queryFn: getHealth
  });
