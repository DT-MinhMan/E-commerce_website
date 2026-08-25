import crypto from "node:crypto";
import mongoose from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import { getConfig, type AppConfig } from "../../config/env.js";
import { sendOtpEmail } from "../../common/services/emailService.js";
import { RefreshTokenModel } from "../users/refreshToken.model.js";
import { UserModel, type UserDocument } from "../users/user.model.js";
import { EmailVerificationModel } from "./emailVerification.model.js";
import { hashPassword, verifyPassword } from "./password.js";
import type {
  AuthResult,
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  RegisterResult,
  RequestContext,
  ResendOtpInput,
  SafeUser,
  VerifyEmailInput
} from "./auth.types.js";
import {
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  signAccessToken,
  toUserId
} from "./tokens.js";

const toSafeUser = (user: UserDocument): SafeUser => ({
  id: toUserId(user._id),
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  status: user.status,
  authProvider: user.authProvider,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const isDuplicateKeyError = (error: unknown): boolean =>
  error instanceof mongoose.mongo.MongoServerError && error.code === 11000;

const generateOtpCode = (): string => crypto.randomInt(100000, 999999).toString();
const hashOtpCode = (code: string): string => crypto.createHash("sha256").update(code).digest("hex");

const assertCanLogin = (user: UserDocument): void => {
  if (user.status === "UNVERIFIED") {
    throw new AppError(403, "AUTH_EMAIL_NOT_VERIFIED", "Email is not verified");
  }

  if (user.status === "INACTIVE") {
    throw new AppError(403, "AUTH_ACCOUNT_INACTIVE", "Account is inactive");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(403, "AUTH_ACCOUNT_BLOCKED", "Account is blocked");
  }
};

const createRefreshToken = async (
  user: UserDocument,
  context: RequestContext,
  config: AppConfig
): Promise<{ rawToken: string; expiresAt: Date; tokenId: mongoose.Types.ObjectId }> => {
  const rawToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiresAt(config);
  const refreshToken = await RefreshTokenModel.create({
    userId: user._id,
    tokenHash: hashRefreshToken(rawToken),
    expiresAt,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress
  });

  return {
    rawToken,
    expiresAt,
    tokenId: refreshToken._id
  };
};

const buildAuthResult = async (user: UserDocument, context: RequestContext, config: AppConfig): Promise<AuthResult> => {
  const refreshToken = await createRefreshToken(user, context, config);

  return {
    user: toSafeUser(user),
    accessToken: signAccessToken(config, { sub: toUserId(user._id), role: user.role }),
    refreshToken: refreshToken.rawToken,
    refreshTokenExpiresAt: refreshToken.expiresAt
  };
};

export const register = async (
  input: RegisterInput,
  _context: RequestContext,
  _config: AppConfig = getConfig()
): Promise<RegisterResult> => {
  const passwordHash = await hashPassword(input.password);

  const existingUser = await UserModel.findOne({ email: input.email }).exec();
  if (existingUser) {
    if (existingUser.status !== "UNVERIFIED") {
      throw new AppError(409, "AUTH_EMAIL_ALREADY_EXISTS", "Email is already registered");
    }

    existingUser.passwordHash = passwordHash;
    existingUser.fullName = input.fullName;
    await existingUser.save();

    const code = generateOtpCode();
    await EmailVerificationModel.deleteMany({ email: input.email });
    await EmailVerificationModel.create({
      userId: existingUser._id,
      email: input.email,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOtpEmail(input.email, code);

    return {
      email: input.email,
      message: "Verification code sent to your email address"
    };
  }

  try {
    const user = await UserModel.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: "CUSTOMER",
      status: "UNVERIFIED",
      authProvider: "LOCAL"
    });

    const code = generateOtpCode();
    await EmailVerificationModel.deleteMany({ email: input.email });
    await EmailVerificationModel.create({
      userId: user._id,
      email: input.email,
      codeHash: hashOtpCode(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    await sendOtpEmail(input.email, code);

    return {
      email: input.email,
      message: "Verification code sent to your email address"
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(409, "AUTH_EMAIL_ALREADY_EXISTS", "Email is already registered");
    }

    throw error;
  }
};

export const verifyEmail = async (
  input: VerifyEmailInput,
  context: RequestContext,
  config: AppConfig = getConfig()
): Promise<AuthResult> => {
  const record = await EmailVerificationModel.findOne({ email: input.email }).exec();

  if (!record) {
    throw new AppError(400, "AUTH_OTP_INVALID", "Verification code is invalid or has expired");
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await record.deleteOne();
    throw new AppError(400, "AUTH_OTP_EXPIRED", "Verification code has expired");
  }

  if (record.attempts >= 5) {
    await record.deleteOne();
    throw new AppError(400, "AUTH_OTP_MAX_ATTEMPTS", "Maximum verification attempts exceeded. Please request a new code");
  }

  const codeMatches = hashOtpCode(input.code) === record.codeHash;

  if (!codeMatches) {
    record.attempts += 1;
    await record.save();
    throw new AppError(400, "AUTH_OTP_INVALID", "Verification code is incorrect");
  }

  const user = await UserModel.findById(record.userId).exec();

  if (!user) {
    await record.deleteOne();
    throw new AppError(400, "AUTH_OTP_INVALID", "User for this verification code was not found");
  }

  user.status = "ACTIVE";
  await user.save();
  await record.deleteOne();

  return await buildAuthResult(user, context, config);
};

export const resendOtp = async (input: ResendOtpInput): Promise<RegisterResult> => {
  const user = await UserModel.findOne({ email: input.email, status: "UNVERIFIED" }).exec();

  if (!user) {
    throw new AppError(400, "AUTH_OTP_RESEND_FAILED", "No unverified account found for this email");
  }

  await EmailVerificationModel.deleteMany({ email: input.email });

  const code = generateOtpCode();
  await EmailVerificationModel.create({
    userId: user._id,
    email: input.email,
    codeHash: hashOtpCode(code),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000)
  });

  await sendOtpEmail(input.email, code);

  return {
    email: input.email,
    message: "Verification code sent to your email address"
  };
};

export const loginWithGoogle = async (
  input: GoogleLoginInput,
  context: RequestContext,
  config: AppConfig = getConfig()
): Promise<AuthResult> => {
  let googleEmail = "";
  let googleSub = "";
  let googleName = "";

  try {
    const googleClientId = config.googleClientId ?? "";
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(googleClientId);

    let payload: { email?: string; email_verified?: boolean; name?: string; sub?: string } | undefined;
    const isJwt = input.idToken.split(".").length === 3;

    if (isJwt) {
      const ticket = await client.verifyIdToken({
        idToken: input.idToken,
        audience: googleClientId
      });
      payload = ticket.getPayload();
    } else {
      // Treat as OAuth2 access token and verify/fetch userInfo from Google API
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: {
          Authorization: `Bearer ${input.idToken}`
        }
      });
      if (!response.ok) {
        throw new AppError(401, "AUTH_GOOGLE_INVALID", "Google authentication failed or token is invalid");
      }
      const data = await response.json() as any;
      payload = {
        email: data.email,
        email_verified: data.email_verified === true || data.email_verified === "true",
        name: data.name,
        sub: data.sub
      };
    }

    if (!payload?.email || !payload.email_verified || !payload.sub) {
      throw new AppError(401, "AUTH_GOOGLE_INVALID", "Google authentication failed or email not verified");
    }

    googleEmail = payload.email.toLowerCase();
    googleSub = payload.sub;
    googleName = payload.name ?? payload.email.split("@")[0];
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(401, "AUTH_GOOGLE_INVALID", "Failed to verify Google token");
  }

  let user = await UserModel.findOne({ email: googleEmail }).exec();

  if (user) {
    if (user.status === "BLOCKED") {
      throw new AppError(403, "AUTH_ACCOUNT_BLOCKED", "Account is blocked");
    }

    if (!user.googleId) {
      user.googleId = googleSub;
    }

    if (user.status === "UNVERIFIED") {
      user.status = "ACTIVE";
    }

    await user.save();
    await EmailVerificationModel.deleteMany({ email: googleEmail });
  } else {
    user = await UserModel.create({
      email: googleEmail,
      fullName: googleName,
      role: "CUSTOMER",
      status: "ACTIVE",
      authProvider: "GOOGLE",
      googleId: googleSub
    });
  }

  return await buildAuthResult(user, context, config);
};

export const login = async (
  input: LoginInput,
  context: RequestContext,
  config: AppConfig = getConfig()
): Promise<AuthResult> => {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash").exec();

  if (!user || !user.passwordHash) {
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password");
  }

  assertCanLogin(user);

  return await buildAuthResult(user, context, config);
};

const findRefreshToken = (rawToken: string) =>
  RefreshTokenModel.findOne({ tokenHash: hashRefreshToken(rawToken) }).exec();

const revokeVisibleRefreshChain = async (userId: mongoose.Types.ObjectId, tokenId: mongoose.Types.ObjectId): Promise<void> => {
  const tokensToRevoke = new Set<string>([tokenId.toString()]);
  const current = await RefreshTokenModel.findById(tokenId).select("replacedByTokenId").lean().exec();

  if (current?.replacedByTokenId) {
    tokensToRevoke.add(current.replacedByTokenId.toString());
  }

  await RefreshTokenModel.updateMany(
    { userId, _id: { $in: [...tokensToRevoke].map((id) => new mongoose.Types.ObjectId(id)) }, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  ).exec();
};

export const refresh = async (
  rawRefreshToken: string | undefined,
  context: RequestContext,
  config: AppConfig = getConfig()
): Promise<AuthResult> => {
  if (!rawRefreshToken) {
    throw new AppError(401, "AUTH_TOKEN_MISSING", "Refresh token is missing");
  }

  const storedToken = await findRefreshToken(rawRefreshToken);

  if (!storedToken) {
    throw new AppError(401, "AUTH_REFRESH_TOKEN_INVALID", "Refresh token is invalid");
  }

  if (storedToken.revokedAt) {
    await revokeVisibleRefreshChain(storedToken.userId, storedToken._id);
    throw new AppError(401, "AUTH_REFRESH_TOKEN_REUSED", "Refresh token has already been used");
  }

  if (storedToken.expiresAt.getTime() <= Date.now()) {
    throw new AppError(401, "AUTH_REFRESH_TOKEN_EXPIRED", "Refresh token has expired");
  }

  const user = await UserModel.findById(storedToken.userId).exec();

  if (!user) {
    throw new AppError(401, "AUTH_REFRESH_TOKEN_INVALID", "Refresh token is invalid");
  }

  assertCanLogin(user);

  const replacement = await createRefreshToken(user, context, config);
  const rotationResult = await RefreshTokenModel.updateOne(
    { _id: storedToken._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), replacedByTokenId: replacement.tokenId } }
  ).exec();

  if (rotationResult.modifiedCount !== 1) {
    await RefreshTokenModel.updateOne({ _id: replacement.tokenId }, { $set: { revokedAt: new Date() } }).exec();
    throw new AppError(401, "AUTH_REFRESH_TOKEN_REUSED", "Refresh token has already been used");
  }

  return {
    user: toSafeUser(user),
    accessToken: signAccessToken(config, { sub: toUserId(user._id), role: user.role }),
    refreshToken: replacement.rawToken,
    refreshTokenExpiresAt: replacement.expiresAt
  };
};

export const logout = async (rawRefreshToken: string | undefined): Promise<void> => {
  if (!rawRefreshToken) {
    return;
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  await RefreshTokenModel.updateOne(
    { tokenHash, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } }
  ).exec();
};

export const getUserById = async (userId: string): Promise<SafeUser> => {
  const user = await UserModel.findById(userId).exec();

  if (!user) {
    throw new AppError(401, "AUTH_ACCESS_TOKEN_INVALID", "Access token is invalid");
  }

  assertCanLogin(user);

  return toSafeUser(user);
};

export const changePassword = async (
  userId: string,
  input: { currentPassword: string; newPassword: string }
): Promise<void> => {
  const user = await UserModel.findById(userId).select("+passwordHash").exec();

  if (!user) {
    throw new AppError(401, "AUTH_ACCESS_TOKEN_INVALID", "Access token is invalid");
  }

  assertCanLogin(user);

  if (!user.passwordHash) {
    throw new AppError(400, "AUTH_INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  }

  const passwordMatches = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(400, "AUTH_INVALID_CURRENT_PASSWORD", "Current password is incorrect");
  }

  user.passwordHash = await hashPassword(input.newPassword);
  await user.save();
};
