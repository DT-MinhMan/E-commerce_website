import type { Request, Response, NextFunction } from "express";
import { getConfig } from "../../config/env.js";
import { successResponse } from "../../common/utils/apiResponse.js";
import { parseLoginInput, parseRegisterInput } from "./auth.validation.js";
import { REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieOptions } from "./tokens.js";
import { login, logout, refresh, register } from "./auth.service.js";

const getRequestContext = (req: Request) => ({
  userAgent: req.get("user-agent"),
  ipAddress: req.ip
});

const setRefreshCookie = (res: Response, refreshToken: string, expiresAt: Date): void => {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions(getConfig(), expiresAt));
};

const clearRefreshCookie = (res: Response): void => {
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieOptions(getConfig()));
};

export const registerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await register(parseRegisterInput(req.body), getRequestContext(req));
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(201).json(successResponse({ user: result.user, accessToken: result.accessToken }));
  } catch (error) {
    next(error);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await login(parseLoginInput(req.body), getRequestContext(req));
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json(successResponse({ user: result.user, accessToken: result.accessToken }));
  } catch (error) {
    next(error);
  }
};

export const refreshController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await refresh(req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined, getRequestContext(req));
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    res.status(200).json(successResponse({ user: result.user, accessToken: result.accessToken }));
  } catch (error) {
    next(error);
  }
};

export const logoutController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await logout(req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined);
    clearRefreshCookie(res);
    res.status(200).json(successResponse({ loggedOut: true }));
  } catch (error) {
    next(error);
  }
};
