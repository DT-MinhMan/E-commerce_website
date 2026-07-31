import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
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

const createUser = async (email: string, password = "ChangeMe123!", status: "ACTIVE" | "INACTIVE" | "BLOCKED" = "ACTIVE") =>
  UserModel.create({
    email,
    passwordHash: await bcrypt.hash(password, 10),
    fullName: "Demo User",
    role: "CUSTOMER",
    status
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

  it("registers a customer, sets refresh cookie and never returns passwordHash", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validRegisterPayload(), role: "ADMIN" })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe("customer@example.com");
    expect(response.body.data.user.role).toBe("CUSTOMER");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(getRefreshCookie(response)).toContain("refreshToken=");

    const user = await UserModel.findOne({ email: "customer@example.com" }).select("+passwordHash").exec();
    expect(user?.role).toBe("CUSTOMER");
    expect(user?.passwordHash).toBeDefined();
    expect(user?.passwordHash).not.toBe("ChangeMe123!");
    expect(await RefreshTokenModel.countDocuments({ userId: user?._id })).toBe(1);
  });

  it("maps duplicate email to a stable auth error", async () => {
    await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validRegisterPayload(), email: "CUSTOMER@example.com" })
      .expect(409);

    expect(response.body.error.code).toBe("AUTH_EMAIL_ALREADY_EXISTS");
  });

  it("logs in active users and rejects invalid credentials generically", async () => {
    await createUser("customer@example.com");

    const success = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "customer@example.com", password: "ChangeMe123!" })
      .expect(200);
    expect(success.body.data.accessToken).toEqual(expect.any(String));
    expect(success.body.data.user).not.toHaveProperty("passwordHash");

    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "customer@example.com", password: "wrong-password" })
      .expect(401);
    expect(wrongPassword.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");

    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "missing@example.com", password: "ChangeMe123!" })
      .expect(401);
    expect(unknownEmail.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
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
    const registered = await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);
    const accessToken = registered.body.data.accessToken as string;

    const currentUser = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(currentUser.body.data.user.email).toBe("customer@example.com");

    const missing = await request(app).get("/api/v1/users/me").expect(401);
    expect(missing.body.error.code).toBe("AUTH_TOKEN_MISSING");

    const invalid = await request(app).get("/api/v1/users/me").set("Authorization", "Bearer invalid").expect(401);
    expect(invalid.body.error.code).toBe("AUTH_ACCESS_TOKEN_INVALID");

    const expiredToken = jwt.sign({ sub: currentUser.body.data.user.id, role: "CUSTOMER" }, process.env.JWT_ACCESS_SECRET as string, {
      expiresIn: "-1s"
    });
    const expired = await request(app).get("/api/v1/users/me").set("Authorization", `Bearer ${expiredToken}`).expect(401);
    expect(expired.body.error.code).toBe("AUTH_ACCESS_TOKEN_INVALID");
  });

  it("refreshes by rotating refresh tokens and revoking the old token", async () => {
    const login = await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);
    const originalCookie = getRefreshCookie(login);
    const originalToken = await RefreshTokenModel.findOne().exec();

    const refreshed = await request(app).post("/api/v1/auth/refresh").set("Cookie", originalCookie).expect(200);
    expect(refreshed.body.data.accessToken).toEqual(expect.any(String));
    expect(getRefreshCookie(refreshed)).toContain("refreshToken=");

    const rotatedOriginal = await RefreshTokenModel.findById(originalToken?._id).exec();
    expect(rotatedOriginal?.revokedAt).toBeInstanceOf(Date);
    expect(rotatedOriginal?.replacedByTokenId).toBeDefined();
    expect(await RefreshTokenModel.countDocuments()).toBe(2);
  });

  it("rejects expired and reused refresh tokens", async () => {
    const login = await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);
    const cookie = getRefreshCookie(login);

    await RefreshTokenModel.updateOne({}, { $set: { expiresAt: new Date(Date.now() - 1000) } }).exec();
    const expired = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie).expect(401);
    expect(expired.body.error.code).toBe("AUTH_REFRESH_TOKEN_EXPIRED");

    await clearTestDatabase();
    const secondLogin = await request(app).post("/api/v1/auth/register").send({ ...validRegisterPayload(), email: "reuse@example.com" }).expect(201);
    const reusedCookie = getRefreshCookie(secondLogin);
    await request(app).post("/api/v1/auth/refresh").set("Cookie", reusedCookie).expect(200);

    const reused = await request(app).post("/api/v1/auth/refresh").set("Cookie", reusedCookie).expect(401);
    expect(reused.body.error.code).toBe("AUTH_REFRESH_TOKEN_REUSED");
  });

  it("logs out by revoking current refresh token and clearing the cookie", async () => {
    const login = await request(app).post("/api/v1/auth/register").send(validRegisterPayload()).expect(201);
    const cookie = getRefreshCookie(login);

    const logout = await request(app).post("/api/v1/auth/logout").set("Cookie", cookie).expect(200);
    expect(logout.body.data.loggedOut).toBe(true);

    const storedToken = await RefreshTokenModel.findOne().exec();
    expect(storedToken?.revokedAt).toBeInstanceOf(Date);

    const refresh = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie).expect(401);
    expect(refresh.body.error.code).toBe("AUTH_REFRESH_TOKEN_REUSED");
  });
});
