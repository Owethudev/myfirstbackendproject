import assert from "node:assert/strict";
import test from "node:test";
import {
  canManageContent,
  getContentAuthor,
  pickPostContentUpdates,
} from "./contentOwnership.js";

test("content author is derived from the authenticated user", () => {
  assert.equal(getContentAuthor({ role: "user", username: " owner " }), "owner");
  assert.equal(getContentAuthor({ role: "user", username: "attacker" }), "attacker");
  assert.equal(getContentAuthor({ role: "guest", username: "owner" }), null);
  assert.equal(getContentAuthor({ role: "user", username: "" }), null);
  assert.equal(getContentAuthor(null), null);
});

test("only the owner or an admin can manage existing content", () => {
  assert.equal(
    canManageContent({ role: "user", username: "owner" }, "owner"),
    true,
  );
  assert.equal(
    canManageContent({ role: "user", username: "attacker" }, "owner"),
    false,
  );
  assert.equal(canManageContent({ role: "admin", username: "admin" }, "owner"), true);
  assert.equal(canManageContent({ role: "guest", username: "owner" }, "owner"), false);
  assert.equal(canManageContent({ role: "user", username: "owner" }, "Unknown"), false);
});

test("post updates allow content fields but exclude ownership and moderation fields", () => {
  assert.deepEqual(
    pickPostContentUpdates({
      name: "Updated",
      description: "New description",
      portfolio: "https://example.test",
      author: "attacker",
      reported: true,
      reportReason: "reason",
      moderationStatus: "removed",
    }),
    {
      name: "Updated",
      description: "New description",
      portfolio: "https://example.test",
    },
  );
  assert.deepEqual(pickPostContentUpdates({ author: "attacker" }), {});
});
