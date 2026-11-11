import assert from "node:assert/strict";
import test from "node:test";
import {
  logoutUser,
  resolveProfileUpdateTargetId,
  updateUser,
} from "./user.service.js";

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
