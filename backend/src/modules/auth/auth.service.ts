import mongoose from "mongoose";
import { AppError } from "../../common/errors/AppError.js";
import { getConfig, type AppConfig } from "../../config/env.js";
import { RefreshTokenModel } from "../users/refreshToken.model.js";
import { UserModel, type UserDocument } from "../users/user.model.js";
import { hashPassword, verifyPassword } from "./password.js";
import type { AuthResult, LoginInput, RequestContext, SafeUser, RegisterInput } from "./auth.types.js";
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
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const isDuplicateKeyError = (error: unknown): boolean =>
  error instanceof mongoose.mongo.MongoServerError && error.code === 11000;

const assertCanLogin = (user: UserDocument): void => {
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
  context: RequestContext,
  config: AppConfig = getConfig()
): Promise<AuthResult> => {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await UserModel.create({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      role: "CUSTOMER",
      status: "ACTIVE"
    });

    return await buildAuthResult(user, context, config);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new AppError(409, "AUTH_EMAIL_ALREADY_EXISTS", "Email is already registered");
    }

    throw error;
  }
};

export const login = async (
  input: LoginInput,
  context: RequestContext,
  config: AppConfig = getConfig()
): Promise<AuthResult> => {
  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash").exec();

  if (!user) {
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password");
  }

  assertCanLogin(user);

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Invalid email or password");
  }

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
