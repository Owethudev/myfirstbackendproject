import assert from "node:assert/strict";
import test from "node:test";
import { User } from "../models/user.model.js";
import {
  buildVerificationTokenExpiry,
  logoutUser,
  registerUser,
  resolveProfileUpdateTargetId,
  deleteUser,
  updateUser,
} from "./user.service.js";

test("new verification tokens expire after 24 hours", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const expiry = buildVerificationTokenExpiry(createdAt);

  assert.equal(expiry.getTime() - createdAt.getTime(), 24 * 60 * 60 * 1000);
});

test("registration deletes the newly created account when verification email delivery fails", async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;
  const originalFindOneAndDelete = User.findOneAndDelete;
  const createdUsers = [];
  const deletedEmails = [];

  User.findOne = async () => null;
  User.create = async (payload) => {
    const user = { _id: "new-user-1", ...payload };
    createdUsers.push(user);
    return user;
  };
  User.findOneAndDelete = async (query) => {
    deletedEmails.push(query.email);
    return createdUsers.find((user) => user.email === query.email) ?? null;
  };

  try {
    const result = await registerUser(
      {
        username: "new-member",
        email: "New.Member@example.test",
        password: "password123",
      },
      async () => {
        throw new Error("Email provider unavailable");
      },
    );

    assert.equal(result.statusCode, 500);
    assert.equal(
      result.payload.message,
      "Account could not be created because the verification email could not be sent.",
    );
    assert.deepEqual(deletedEmails, ["new.member@example.test"]);
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
    User.findOneAndDelete = originalFindOneAndDelete;
  }
});

test("ordinary users can update only their own profile", () => {
  const principal = { id: "user-1", role: "user" };

  assert.equal(resolveProfileUpdateTargetId(principal, "user-1"), "user-1");
  assert.equal(resolveProfileUpdateTargetId(principal), "user-1");
  assert.equal(resolveProfileUpdateTargetId(principal, "user-2"), null);
});

test("admins retain the existing ability to select a profile target", () => {
  const principal = { id: "admin-1", role: "admin" };

  assert.equal(resolveProfileUpdateTargetId(principal, "user-2"), "user-2");
  assert.equal(resolveProfileUpdateTargetId(principal), "admin-1");
});

test("missing identity and unsupported roles cannot update profiles", () => {
  assert.equal(resolveProfileUpdateTargetId(null, "user-1"), null);
  assert.equal(resolveProfileUpdateTargetId({ role: "user" }, "user-1"), null);
  assert.equal(resolveProfileUpdateTargetId({ id: "user-1", role: "guest" }), null);
});

test("cross-account profile updates are denied before repository access", async () => {
  const result = await updateUser(
    { id: "user-1", role: "user" },
    { id: "user-2", username: "changed" },
  );

  assert.equal(result.statusCode, 403);
  assert.equal(result.payload.message, "You are not authorized to update this profile");
});

test("logout rejects requests without an authenticated session context", async () => {
  const result = await logoutUser("user-1", null, false);

  assert.equal(result.statusCode, 401);
  assert.equal(result.payload.message, "Session expired.");
});

test("admins cannot delete their own account, even with email case or whitespace changes", async () => {
  const originalFindOneAndDelete = User.findOneAndDelete;
  let deleteCalled = false;
  User.findOneAndDelete = async () => {
    deleteCalled = true;
    return { email: "admin@example.test" };
  };

  try {
    const result = await deleteUser(" Admin@Example.Test ", {
      id: "admin-1",
      email: "admin@example.test",
      role: "admin",
    });

    assert.equal(result.statusCode, 403);
    assert.equal(
      result.payload.message,
      "Administrators cannot delete their own account",
    );
    assert.equal(deleteCalled, false);
  } finally {
    User.findOneAndDelete = originalFindOneAndDelete;
  }
});

test("admins can still delete another account", async () => {
  const originalFindOneAndDelete = User.findOneAndDelete;
  let deletedEmail;
  User.findOneAndDelete = async (query) => {
    deletedEmail = query.email;
    return { email: query.email };
  };

  try {
    const result = await deleteUser("member@example.test", {
      id: "admin-1",
      email: "admin@example.test",
      role: "admin",
    });

    assert.equal(result.statusCode, 200);
    assert.equal(deletedEmail, "member@example.test");
  } finally {
    User.findOneAndDelete = originalFindOneAndDelete;
  }
});
