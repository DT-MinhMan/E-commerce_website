import { apiClient, refreshSession, setAccessToken } from "../../../lib/apiClient.js";
import type { AuthSession, AuthUser, ChangePasswordRequest, LoginRequest, RegisterRequest } from "../types.js";

interface AuthResponse {
  success: true;
  data: AuthSession;
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

export const registerCustomer = async (input: RegisterRequest): Promise<void> => {
  await apiClient.post<AuthResponse>("/auth/register", input);
  setAccessToken(null);
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
