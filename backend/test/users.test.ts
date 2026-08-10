import bcrypt from "bcryptjs";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { getConfig } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { UserModel } from "../src/modules/users/user.model.js";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "./helpers/database.js";

describe("users API", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  });

  beforeEach(async () => {
    await clearTestDatabase();
  });

  afterAll(async () => {
    await disconnectTestDatabase();
  });

  it("returns 401 when fetching current user without access token", async () => {
    const response = await request(app).get("/api/v1/users/me").expect(401);
    expect(response.body.error.code).toBe("AUTH_TOKEN_MISSING");
  });

  it("returns profile of currently authenticated user without exposing passwordHash", async () => {
    const user = await UserModel.create({
      email: "john.doe@example.com",
      passwordHash: await bcrypt.hash("SecurePass123!", 10),
      fullName: "John Doe",
      role: "CUSTOMER",
      status: "ACTIVE"
    });

    const token = signAccessToken(getConfig(), { sub: user._id.toString(), role: "CUSTOMER" });

    const response = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(user._id.toString());
    expect(response.body.data.user.email).toBe("john.doe@example.com");
    expect(response.body.data.user.fullName).toBe("John Doe");
    expect(response.body.data.user.role).toBe("CUSTOMER");
    expect(response.body.data.user).not.toHaveProperty("passwordHash");
  });

  describe("PUT /api/v1/users/me/password", () => {
    it("returns 401 when changing password without access token", async () => {
      const response = await request(app)
        .put("/api/v1/users/me/password")
        .send({ currentPassword: "OldPassword123", newPassword: "NewPassword123" })
        .expect(401);

      expect(response.body.error.code).toBe("AUTH_TOKEN_MISSING");
    });

    it("returns 400 when current password is incorrect", async () => {
      const user = await UserModel.create({
        email: "user@example.com",
        passwordHash: await bcrypt.hash("OldPassword123", 10),
        fullName: "User Test",
        role: "CUSTOMER",
        status: "ACTIVE"
      });

      const token = signAccessToken(getConfig(), { sub: user._id.toString(), role: "CUSTOMER" });

      const response = await request(app)
        .put("/api/v1/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "WrongPassword123", newPassword: "NewPassword123" })
        .expect(400);

      expect(response.body.error.code).toBe("AUTH_INVALID_CURRENT_PASSWORD");
    });

    it("returns 400 when new password violates security policy", async () => {
      const user = await UserModel.create({
        email: "user@example.com",
        passwordHash: await bcrypt.hash("OldPassword123", 10),
        fullName: "User Test",
        role: "CUSTOMER",
        status: "ACTIVE"
      });

      const token = signAccessToken(getConfig(), { sub: user._id.toString(), role: "CUSTOMER" });

      const response = await request(app)
        .put("/api/v1/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "OldPassword123", newPassword: "short" })
        .expect(400);

      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("successfully changes password and permits login with new password", async () => {
      const user = await UserModel.create({
        email: "user@example.com",
        passwordHash: await bcrypt.hash("OldPassword123", 10),
        fullName: "User Test",
        role: "CUSTOMER",
        status: "ACTIVE"
      });

      const token = signAccessToken(getConfig(), { sub: user._id.toString(), role: "CUSTOMER" });

      const changeRes = await request(app)
        .put("/api/v1/users/me/password")
        .set("Authorization", `Bearer ${token}`)
        .send({ currentPassword: "OldPassword123", newPassword: "NewPassword123" })
        .expect(200);

      expect(changeRes.body.success).toBe(true);

      // Verify login with new password succeeds
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "user@example.com", password: "NewPassword123" })
        .expect(200);

      expect(loginRes.body.success).toBe(true);

      // Verify login with old password fails
      await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "user@example.com", password: "OldPassword123" })
        .expect(401);
    });
  });
});
