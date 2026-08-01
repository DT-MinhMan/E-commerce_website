import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getCurrentUser,
  loginCustomer,
  logoutCustomer,
  refreshAuthSession,
  registerCustomer
} from "../services/authService.js";
import { cartKeys } from "./useCartQueries.js";
import { orderKeys } from "./useOrderQueries.js";
import { paymentKeys } from "./usePaymentQueries.js";
import type { ApiError } from "../services/apiClient.js";
import { useAuthStore } from "../store/authStore.js";
import type { AuthUser, LoginRequest, RegisterRequest } from "../types/auth.js";

export const currentUserQueryKey = ["currentUser"] as const;

const getErrorMessage = (error: unknown, fallback: string): string => (error as ApiError).message ?? fallback;

export const useRefreshSession = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshAuthSession,
    onMutate: () => {
      if (useAuthStore.getState().status === "idle") {
        setStatus("loading");
      }
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(currentUserQueryKey, session.user);
    },
    onError: () => {
      clearSession();
    }
  });
};

export const useLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setError = useAuthStore((state) => state.setError);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginRequest) => loginCustomer(input),
    onMutate: () => {
      setStatus("loading");
      setError(null);
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(currentUserQueryKey, session.user);
    },
    onError: (error) => {
      clearSession(getErrorMessage(error, "Unable to log in"));
    }
  });
};

export const useRegister = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setError = useAuthStore((state) => state.setError);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterRequest) => registerCustomer(input),
    onMutate: () => {
      setStatus("loading");
      setError(null);
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(currentUserQueryKey, session.user);
    },
    onError: (error) => {
      clearSession(getErrorMessage(error, "Unable to register"));
    }
  });
};

export const useLogout = () => {
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setError = useAuthStore((state) => state.setError);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutCustomer,
    onMutate: () => {
      setStatus("loading");
      setError(null);
    },
    onSuccess: () => {
      clearSession();
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
      queryClient.removeQueries({ queryKey: cartKeys.current() });
      queryClient.removeQueries({ queryKey: orderKeys.all });
      queryClient.removeQueries({ queryKey: paymentKeys.all });
    },
    onError: (error) => {
      clearSession(getErrorMessage(error, "Unable to log out"));
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
      queryClient.removeQueries({ queryKey: cartKeys.current() });
      queryClient.removeQueries({ queryKey: orderKeys.all });
      queryClient.removeQueries({ queryKey: paymentKeys.all });
    }
  });
};

export const useCurrentUser = (enabled = true) => {
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const query = useQuery<AuthUser, ApiError>({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    enabled,
    retry: false
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  useEffect(() => {
    if (query.error) {
      clearSession(query.error.message ?? "Unable to load account");
    }
  }, [clearSession, query.error]);

  return query;
};
