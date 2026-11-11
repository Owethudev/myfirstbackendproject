import assert from "node:assert/strict";
import test from "node:test";
import { POST_MODERATION_STATUSES } from "../models/post.model.js";
import { buildPostReviewUpdates } from "./postModeration.js";

test("admin review accepts every existing moderation status", () => {
  for (const moderationStatus of POST_MODERATION_STATUSES) {
    assert.deepEqual(buildPostReviewUpdates({ moderationStatus }), {
      updates: { moderationStatus },
    });
  }
});

test("admin review rejects unsupported moderation statuses", () => {
  for (const moderationStatus of ["hidden", "REMOVED", {}, 1]) {
    assert.deepEqual(buildPostReviewUpdates({ moderationStatus }), {
      error: "Invalid moderation status",
    });
  }
});

test("review updates preserve existing report field handling", () => {
  assert.deepEqual(
    buildPostReviewUpdates({
      reported: false,
      reportReason: null,
      moderationStatus: "approved",
    }),
    {
      updates: {
        reported: false,
        reportReason: null,
        moderationStatus: "approved",
      },
    },
  );
  assert.deepEqual(buildPostReviewUpdates({ reported: "true" }), {
    updates: {},
  });
  assert.deepEqual(buildPostReviewUpdates({ moderationStatus: "" }), {
    updates: {},
  });
});
