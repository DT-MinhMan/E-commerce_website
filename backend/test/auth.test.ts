import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { EmailVerificationModel } from "../src/modules/auth/emailVerification.model.js";
import { PasswordResetModel } from "../src/modules/auth/passwordReset.model.js";
import { RefreshTokenModel } from "../src/modules/users/refreshToken.model.js";
import { UserModel } from "../src/modules/users/user.model.js";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "./helpers/database.js";

const validRegisterPayload = () => ({
  email: "customer@example.com",
  password: "ChangeMe123!",
  fullName: "Demo Customer"
});

const getRefreshCookie = (response: request.Response): string => {
  const setCookie = response.headers["set-cookie"];
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;

  if (!cookie) {
    throw new Error("Missing set-cookie header");
  }

  return cookie.split(";")[0];
};

const createUser = async (email: string, password = "ChangeMe123!", status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "UNVERIFIED" = "ACTIVE") =>
  UserModel.create({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    fullName: "Demo User",
    role: "CUSTOMER",
    status,
    authProvider: "LOCAL"
  });

describe("auth API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("registers a customer as UNVERIFIED, creates OTP verification record and does not return tokens", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validRegisterPayload(), role: "ADMIN" })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("customer@example.com");
    expect(response.body.data).not.toHaveProperty("accessToken");

    const user = await UserModel.findOne({ email: "customer@example.com" }).exec();
    expect(user?.role).toBe("CUSTOMER");
    expect(user?.status).toBe("UNVERIFIED");

    const otpRecord = await EmailVerificationModel.findOne({ email: "customer@example.com" }).exec();
    expect(otpRecord).not.toBeNull();
    expect(otpRecord?.codeHash).toBeDefined();
  });

  it("verifies OTP successfully, activates user and returns tokens", async () => {
    await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);

    const code = "123456";
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    await EmailVerificationModel.updateOne({ email: "customer@example.com" }, { $set: { codeHash } }).exec();

    const response = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: "customer@example.com", code })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("customer@example.com");
    expect(response.body.data.user.status).toBe("ACTIVE");
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(getRefreshCookie(response)).toContain("refreshToken=");

    const updatedUser = await UserModel.findOne({ email: "customer@example.com" }).exec();
    expect(updatedUser?.status).toBe("ACTIVE");

    const otpAfter = await EmailVerificationModel.findOne({ email: "customer@example.com" }).exec();
    expect(otpAfter).toBeNull();
  });

  it("rejects invalid OTP code and increments attempts", async () => {
    await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);

    const response = await request(app)
      .post("/api/v1/auth/verify-email")
      .send({ email: "customer@example.com", code: "000000" })
      .expect(400);

    expect(response.body.error.code).toBe("AUTH_OTP_INVALID");

    const record = await EmailVerificationModel.findOne({ email: "customer@example.com" }).exec();
    expect(record?.attempts).toBe(1);
  });

  it("resends OTP for unverified user", async () => {
    await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);

    const response = await request(app)
      .post("/api/v1/auth/resend-otp")
      .send({ email: "customer@example.com" })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe("customer@example.com");
  });

  it("maps duplicate active email to 409 error but allows re-registration for UNVERIFIED users", async () => {
    await createUser("customer@example.com", "ChangeMe123!", "ACTIVE");

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validRegisterPayload(), email: "CUSTOMER@example.com" })
      .expect(409);

    expect(response.body.error.code).toBe("AUTH_EMAIL_ALREADY_EXISTS");

    await request(app).post("/api/v1/auth/register").send({ ...validRegisterPayload(), email: "unverified_test@example.com" }).expect(201);
    const reRegister = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "unverified_test@example.com", password: "NewPassword123!", fullName: "Updated Name" })
      .expect(201);
    expect(reRegister.body.success).toBe(true);
  });

  it("logs in active users and rejects unverified or invalid credentials", async () => {
    await createUser("active@example.com", "ChangeMe123!", "ACTIVE");
    await createUser("unverified@example.com", "ChangeMe123!", "UNVERIFIED");

    const success = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "active@example.com", password: "ChangeMe123!" })
      .expect(200);
    expect(success.body.data.accessToken).toEqual(expect.any(String));

    const unverifiedWrongPass = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "unverified@example.com", password: "WrongPassword123!" })
      .expect(401);
    expect(unverifiedWrongPass.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");

    const unverifiedCorrectPass = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "unverified@example.com", password: "ChangeMe123!" })
      .expect(403);
    expect(unverifiedCorrectPass.body.error.code).toBe("AUTH_EMAIL_NOT_VERIFIED");

    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "active@example.com", password: "wrong-password" })
      .expect(401);
    expect(wrongPassword.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("rejects inactive and blocked users with stable codes", async () => {
    await createUser("inactive@example.com", "ChangeMe123!", "INACTIVE");
    await createUser("blocked@example.com", "ChangeMe123!", "BLOCKED");

    const inactive = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "inactive@example.com", password: "ChangeMe123!" })
      .expect(403);
    expect(inactive.body.error.code).toBe("AUTH_ACCOUNT_INACTIVE");

    const blocked = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "blocked@example.com", password: "ChangeMe123!" })
      .expect(403);
    expect(blocked.body.error.code).toBe("AUTH_ACCOUNT_BLOCKED");
  });

  it("protects current-user endpoint with access tokens", async () => {
    await createUser("active@example.com", "ChangeMe123!", "ACTIVE");
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "active@example.com", password: "ChangeMe123!" })
      .expect(200);
    const accessToken = login.body.data.accessToken as string;

    const currentUser = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(currentUser.body.data.user.email).toBe("active@example.com");

    const missing = await request(app).get("/api/v1/users/me").expect(401);
    expect(missing.body.error.code).toBe("AUTH_TOKEN_MISSING");
  });

  it("refreshes by rotating refresh tokens and revoking the old token", async () => {
    await createUser("active@example.com", "ChangeMe123!", "ACTIVE");
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "active@example.com", password: "ChangeMe123!" })
      .expect(200);
    const originalCookie = getRefreshCookie(login);
    const originalToken = await RefreshTokenModel.findOne().exec();

    const refreshed = await request(app).post("/api/v1/auth/refresh").set("Cookie", originalCookie).expect(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
    expect(getRefreshCookie(refreshed)).toContain("refreshToken=");

    const rotatedOriginal = await RefreshTokenModel.findById(originalToken?._id).exec();
    expect(rotatedOriginal?.revokedAt).toBeInstanceOf(Date);
  });

  describe("POST /api/v1/auth/forgot-password and /reset-password", () => {
    it("creates a password reset record and returns generic message for valid user", async () => {
      await createUser("reset@example.com", "Password123!");

      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "reset@example.com" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBeDefined();

      const record = await PasswordResetModel.findOne({ email: "reset@example.com" }).exec();
      expect(record).not.toBeNull();
      expect(record?.codeHash).toBeDefined();
      expect(record?.attempts).toBe(0);
    });

    it("returns generic 200 message and creates no record when email does not exist", async () => {
      const res = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "nonexistent@example.com" })
        .expect(200);

      expect(res.body.success).toBe(true);
      const record = await PasswordResetModel.findOne({ email: "nonexistent@example.com" }).exec();
      expect(record).toBeNull();
    });

    it("returns generic 200 message and creates no record for unverified or blocked user", async () => {
      await createUser("unverified@example.com", "Password123!", "UNVERIFIED");
      await createUser("blocked-reset@example.com", "Password123!", "BLOCKED");

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "unverified@example.com" })
        .expect(200);
      expect(await PasswordResetModel.findOne({ email: "unverified@example.com" }).exec()).toBeNull();

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "blocked-reset@example.com" })
        .expect(200);
      expect(await PasswordResetModel.findOne({ email: "blocked-reset@example.com" }).exec()).toBeNull();
    });

    it("returns generic 200 message and creates no record for Google-only user without password", async () => {
      await UserModel.create({
        email: "google-only@example.com",
        fullName: "Google Only",
        role: "CUSTOMER",
        status: "ACTIVE",
        authProvider: "GOOGLE",
        googleId: "g-123"
      });

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "google-only@example.com" })
        .expect(200);

      expect(await PasswordResetModel.findOne({ email: "google-only@example.com" }).exec()).toBeNull();
    });

    it("respects 60s cooldown on forgot-password requests", async () => {
      await createUser("cooldown@example.com", "Password123!");

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "cooldown@example.com" })
        .expect(200);

      const recordFirst = await PasswordResetModel.findOne({ email: "cooldown@example.com" }).exec();
      const firstHash = recordFirst?.codeHash;

      // Second request immediately
      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "cooldown@example.com" })
        .expect(200);

      const recordSecond = await PasswordResetModel.findOne({ email: "cooldown@example.com" }).exec();
      expect(recordSecond?.codeHash).toBe(firstHash);
    });

    it("rejects reset-password with validation error for invalid input", async () => {
      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ email: "invalid", code: "12", newPassword: "short" })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects reset-password with incorrect code and increments attempts", async () => {
      await createUser("reset-wrong@example.com", "Password123!");

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "reset-wrong@example.com" })
        .expect(200);

      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ email: "reset-wrong@example.com", code: "000000", newPassword: "NewPassword123!" })
        .expect(400);

      expect(res.body.error.code).toBe("AUTH_RESET_CODE_INVALID");

      const record = await PasswordResetModel.findOne({ email: "reset-wrong@example.com" }).exec();
      expect(record?.attempts).toBe(1);
    });

    it("deletes reset record after 5 failed attempts", async () => {
      await createUser("reset-max@example.com", "Password123!");

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "reset-max@example.com" })
        .expect(200);

      for (let i = 0; i < 4; i++) {
        await request(app)
          .post("/api/v1/auth/reset-password")
          .send({ email: "reset-max@example.com", code: "000000", newPassword: "NewPassword123!" })
          .expect(400);
      }

      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ email: "reset-max@example.com", code: "000000", newPassword: "NewPassword123!" })
        .expect(400);

      expect(res.body.error.code).toBe("AUTH_OTP_MAX_ATTEMPTS");

      const record = await PasswordResetModel.findOne({ email: "reset-max@example.com" }).exec();
      expect(record).toBeNull();
    });

    it("rejects reset-password if new password is same as current password", async () => {
      await createUser("reset-same@example.com", "CurrentPassword123!");

      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "reset-same@example.com" })
        .expect(200);

      const code = "654321";
      const codeHash = crypto.createHash("sha256").update(code).digest("hex");
      await PasswordResetModel.updateOne({ email: "reset-same@example.com" }, { $set: { codeHash } }).exec();

      const res = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ email: "reset-same@example.com", code, newPassword: "CurrentPassword123!" })
        .expect(400);

      expect(res.body.error.code).toBe("AUTH_PASSWORD_SAME_AS_OLD");
    });

    it("successfully resets password, revokes refresh tokens, and allows login with new password", async () => {
      const user = await createUser("reset-success@example.com", "OldPassword123!");

      // Login to obtain a refresh token
      await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "reset-success@example.com", password: "OldPassword123!" })
        .expect(200);

      const tokenBefore = await RefreshTokenModel.findOne({ userId: user._id }).exec();
      expect(tokenBefore?.revokedAt).toBeUndefined();

      // Request reset
      await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ email: "reset-success@example.com" })
        .expect(200);

      const code = "987654";
      const codeHash = crypto.createHash("sha256").update(code).digest("hex");
      await PasswordResetModel.updateOne({ email: "reset-success@example.com" }, { $set: { codeHash } }).exec();

      // Reset password
      const resetRes = await request(app)
        .post("/api/v1/auth/reset-password")
        .send({ email: "reset-success@example.com", code, newPassword: "BrandNewPassword123!" })
        .expect(200);

      expect(resetRes.body.success).toBe(true);

      // Verify reset record deleted
      const recordAfter = await PasswordResetModel.findOne({ email: "reset-success@example.com" }).exec();
      expect(recordAfter).toBeNull();

      // Verify old refresh token revoked
      const tokenAfter = await RefreshTokenModel.findById(tokenBefore?._id).exec();
      expect(tokenAfter?.revokedAt).toBeInstanceOf(Date);

      // Login with old password should fail
      await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "reset-success@example.com", password: "OldPassword123!" })
        .expect(401);

      // Login with new password should succeed
      const newLogin = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "reset-success@example.com", password: "BrandNewPassword123!" })
        .expect(200);

      expect(newLogin.body.success).toBe(true);
    });
  });
});

