import { apiClient, refreshSession, setAccessToken } from "../../../lib/apiClient.js";
import type {
  AuthSession,
  AuthUser,
  ChangePasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  RegisterResult,
  ResendOtpRequest,
  VerifyEmailRequest
} from "../types.js";

interface AuthResponse {
  success: true;
  data: AuthSession;
  meta: unknown;
}

interface RegisterResponse {
  success: true;
  data: RegisterResult;
  meta: unknown;
}

interface CurrentUserResponse {
  success: true;
  data: {
    user: AuthUser;
  };
  meta: unknown;
}

interface LogoutResponse {
  success: true;
  data: {
    loggedOut: boolean;
  };
  meta: unknown;
}

const applySession = (session: AuthSession): AuthSession => {
  setAccessToken(session.accessToken);
  return session;
};

export const registerCustomer = async (input: RegisterRequest): Promise<RegisterResult> => {
  const response = await apiClient.post<RegisterResponse>("/auth/register", input);
  setAccessToken(null);
  return response.data.data;
};

export const verifyEmail = async (input: VerifyEmailRequest): Promise<AuthSession> => {
  const response = await apiClient.post<AuthResponse>("/auth/verify-email", input);
  return applySession(response.data.data);
};

export const resendOtp = async (input: ResendOtpRequest): Promise<RegisterResult> => {
  const response = await apiClient.post<RegisterResponse>("/auth/resend-otp", input);
  return response.data.data;
};

export const googleLogin = async (input: GoogleLoginRequest): Promise<AuthSession> => {
  const response = await apiClient.post<AuthResponse>("/auth/google", input);
  return applySession(response.data.data);
};

export const loginCustomer = async (input: LoginRequest): Promise<AuthSession> => {
  const response = await apiClient.post<AuthResponse>("/auth/login", input);
  return applySession(response.data.data);
};

export const refreshAuthSession = async (): Promise<AuthSession> => {
  return refreshSession();
};

export const logoutCustomer = async (): Promise<void> => {
  await apiClient.post<LogoutResponse>("/auth/logout");
  setAccessToken(null);
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiClient.get<CurrentUserResponse>("/users/me");
  return response.data.data.user;
};

export const changePassword = async (input: ChangePasswordRequest): Promise<void> => {
  await apiClient.put("/users/me/password", input);
};
