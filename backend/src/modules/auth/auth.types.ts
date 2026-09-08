import type { AuthProvider, UserRole, UserStatus } from "../../database/enums.js";

export interface SafeUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  authProvider: AuthProvider;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface RegisterResult {
  email: string;
  message: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface VerifyEmailInput {
  email: string;
  code: string;
}

export interface ResendOtpInput {
  email: string;
}

export interface GoogleLoginInput {
  idToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}


export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}
