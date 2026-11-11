import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { Session } from "../models/session.model.js";
import { User } from "../models/user.model.js";
import { forgotPassword, resetPassword } from "./auth.service.js";

test("password reset email failures keep the response generic and allow retry", async () => {
  const originalFindOne = User.findOne;
  const originalConsoleError = console.error;
  const email = "member@example.test";
  const user = {
    email,
    username: "member",
    resetPasswordToken: undefined,
    resetPasswordExpires: undefined,
    saveCount: 0,
    async save() {
      this.saveCount += 1;
      return this;
    },
  };
  const logEntries = [];
  const sentResetUrls = [];

  User.findOne = async (query) => query.email === email ? user : null;
  console.error = (...args) => logEntries.push(args);

  try {
    const unknownAccountResult = await forgotPassword(
      "unknown@example.test",
      async () => {
        throw new Error("Email should not be sent for unknown accounts");
      },
    );
    const failedDeliveryResult = await forgotPassword(email, async () => {
      throw new Error("Provider response contains sensitive details");
    });

    assert.deepEqual(failedDeliveryResult, unknownAccountResult);
    assert.equal(failedDeliveryResult.statusCode, 200);
    assert.equal(
      failedDeliveryResult.payload.message,
      "If an account exists with that email, we'll try to send a password reset link. If it doesn't arrive, submit another request; only the newest link will work.",
    );
    assert.equal(user.saveCount, 1);
    assert.match(user.resetPasswordToken, /^[a-f0-9]{64}$/);
    assert.equal(logEntries.length, 1);
    assert.deepEqual(logEntries[0], ["Password reset email delivery failed"]);

    const failedTokenHash = user.resetPasswordToken;
    const retryResult = await forgotPassword(email, async ({ resetUrl }) => {
      sentResetUrls.push(resetUrl);
    });
    const retryToken = new URL(sentResetUrls[0]).pathname.split("/").at(-1);
    const retryTokenHash = crypto.createHash("sha256").update(retryToken).digest("hex");

    assert.deepEqual(retryResult, unknownAccountResult);
    assert.notEqual(retryTokenHash, failedTokenHash);
    assert.equal(user.resetPasswordToken, retryTokenHash);
    assert.equal(user.saveCount, 2);
  } finally {
    User.findOne = originalFindOne;
    console.error = originalConsoleError;
  }
});

test("successful password reset revokes the user's active sessions", async () => {
  const originalFindOne = User.findOne;
  const originalUpdateMany = Session.updateMany;
  const now = new Date();
  const token = "raw-reset-token";
  const expectedHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = {
    _id: "user-1",
    resetPasswordToken: expectedHash,
    resetPasswordExpires: new Date(now.getTime() + 60_000),
    password: "old-password",
    async save() {
      calls.push({ type: "save" });
      return this;
    },
  };
  const calls = [];

  User.findOne = async (query) => {
    calls.push({ type: "find", query });
    return query.resetPasswordToken === expectedHash ? user : null;
  };
  Session.updateMany = async (filter, updates) => {
    calls.push({ type: "revoke", filter, updates });
    return { modifiedCount: 2 };
  };

  try {
    const result = await resetPassword({ token, password: "new-password" });

    assert.equal(result.statusCode, 200);
    assert.equal(result.payload.success, true);
    assert.equal(user.password, "new-password");
    assert.equal(user.resetPasswordToken, undefined);
    assert.equal(user.resetPasswordExpires, undefined);
  } finally {
    User.findOne = originalFindOne;
    Session.updateMany = originalUpdateMany;
  }

  assert.deepEqual(calls[1], {
    type: "revoke",
    filter: { userId: "user-1", active: true },
    updates: { active: false, revokedAt: calls[1].updates.revokedAt },
  });
  assert.ok(calls[1].updates.revokedAt instanceof Date);
  assert.deepEqual(calls[2], { type: "save" });
});

test("session revocation failure prevents the password change", async () => {
  const originalFindOne = User.findOne;
  const originalUpdateMany = Session.updateMany;
  const token = "raw-reset-token";
  let saveCalled = false;
  const user = {
    _id: "user-1",
    password: "old-password",
    async save() {
      saveCalled = true;
    },
  };

  User.findOne = async () => user;
  Session.updateMany = async () => {
    throw new Error("Session store unavailable");
  };

  try {
    await assert.rejects(
      resetPassword({ token, password: "new-password" }),
      /Session store unavailable/,
    );
    assert.equal(user.password, "old-password");
    assert.equal(saveCalled, false);
  } finally {
    User.findOne = originalFindOne;
    Session.updateMany = originalUpdateMany;
  }
});

test("invalid reset tokens do not revoke sessions", async () => {
  const originalFindOne = User.findOne;
  const originalUpdateMany = Session.updateMany;
  let revokeCalled = false;

  User.findOne = async () => null;
  Session.updateMany = async () => {
    revokeCalled = true;
    return { modifiedCount: 0 };
  };

  try {
    const result = await resetPassword({
      token: "invalid-token",
      password: "new-password",
    });

    assert.equal(result.statusCode, 400);
    assert.equal(result.payload.message, "Invalid or expired reset token.");
    assert.equal(revokeCalled, false);
  } finally {
    User.findOne = originalFindOne;
    Session.updateMany = originalUpdateMany;
  }
});
