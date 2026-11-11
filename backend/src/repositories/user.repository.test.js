import assert from "node:assert/strict";
import test from "node:test";
import { User } from "../models/user.model.js";
import {
  buildActiveResetTokenQuery,
  findUserByResetToken,
} from "./user.repository.js";

test("active reset-token query requires an expiry later than now", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  assert.deepEqual(buildActiveResetTokenQuery("hashed-token", now), {
    resetPasswordToken: "hashed-token",
    resetPasswordExpires: { $gt: now },
  });
});

test("reset-token repository lookup uses the active-expiry query", async () => {
  const originalFindOne = User.findOne;
  const now = new Date("2026-01-01T00:00:00.000Z");
  let actualQuery;

  User.findOne = (query) => {
    actualQuery = query;
    return Promise.resolve(null);
  };

  try {
    await findUserByResetToken("hashed-token", now);
  } finally {
    User.findOne = originalFindOne;
  }

  assert.deepEqual(actualQuery, {
    resetPasswordToken: "hashed-token",
    resetPasswordExpires: { $gt: now },
  });
});
