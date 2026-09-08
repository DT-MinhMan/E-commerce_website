import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  changePassword,
  forgotPassword,
  getCurrentUser,
  googleLogin,
  loginCustomer,
  logoutCustomer,
  refreshAuthSession,
  registerCustomer,
  resendOtp,
  resetPassword,
  verifyEmail
} from "../services/authService.js";
import { cartKeys } from "../../cart/hooks/useCartQueries.js";
import { orderKeys } from "../../orders/hooks/useOrderQueries.js";
import { paymentKeys } from "../../payments/hooks/usePaymentQueries.js";
import type { ApiError } from "../../../lib/apiClient.js";
import { useAuthStore } from "../store/authStore.js";
import type {
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from "../types.js";

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
      const message = getErrorMessage(error, "Đăng nhập thất bại");
      clearSession(message);
    }
  });
};

export const useRegister = () => {
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setError = useAuthStore((state) => state.setError);

  return useMutation({
    mutationFn: (input: RegisterRequest) => registerCustomer(input),
    onMutate: () => {
      setStatus("loading");
      setError(null);
    },
    onSuccess: () => {
      setStatus("unauthenticated");
    },
    onError: (error) => {
      clearSession(getErrorMessage(error, "Đăng ký không thành công"));
    }
  });
};

export const useVerifyEmail = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setError = useAuthStore((state) => state.setError);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VerifyEmailRequest) => verifyEmail(input),
    onMutate: () => {
      setStatus("loading");
      setError(null);
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(currentUserQueryKey, session.user);
    },
    onError: (error) => {
      clearSession(getErrorMessage(error, "Xác thực email không thành công"));
    }
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: (input: ResendOtpRequest) => resendOtp(input)
  });
};

export const useGoogleLogin = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const setError = useAuthStore((state) => state.setError);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GoogleLoginRequest) => googleLogin(input),
    onMutate: () => {
      setStatus("loading");
      setError(null);
    },
    onSuccess: (session) => {
      setSession(session);
      queryClient.setQueryData(currentUserQueryKey, session.user);
    },
    onError: (error) => {
      clearSession(getErrorMessage(error, "Đăng nhập Google không thành công"));
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
      clearSession(getErrorMessage(error, "Đăng xuất không thành công"));
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

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (input: ChangePasswordRequest) => changePassword(input)
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (input: ForgotPasswordRequest) => forgotPassword(input)
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (input: ResetPasswordRequest) => resetPassword(input)
  });
};

