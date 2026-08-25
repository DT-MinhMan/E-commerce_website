export type UserRole = "CUSTOMER" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "BLOCKED" | "UNVERIFIED";
export type AuthProvider = "LOCAL" | "GOOGLE";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  authProvider: AuthProvider;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface RegisterResult {
  email: string;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
