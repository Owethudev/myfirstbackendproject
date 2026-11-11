import assert from "node:assert/strict";
import test from "node:test";
import { User } from "../models/user.model.js";
import {
  buildVerificationTokenConsumeQuery,
  consumeUserVerificationToken,
} from "./user.repository.js";

test("verification token consume query requires an unverified account", () => {
  assert.deepEqual(buildVerificationTokenConsumeQuery("verification-token"), {
    verificationToken: "verification-token",
    verified: false,
  });
});

test("verification token is consumed atomically with the verified transition", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const initialUser = {
    verificationToken: "verification-token",
    verified: false,
  };
  let storedUser = { ...initialUser };
  const calls = [];

  User.findOneAndUpdate = async (query, update, options) => {
    calls.push({ query, update, options });

    if (
      storedUser.verificationToken !== query.verificationToken ||
      storedUser.verified !== query.verified
    ) {
      return null;
    }

    storedUser = {
      ...storedUser,
      ...update.$set,
    };
    delete storedUser.verificationToken;
    return { ...storedUser };
  };

  try {
    const [firstResult, secondResult] = await Promise.all([
      consumeUserVerificationToken("verification-token"),
      consumeUserVerificationToken("verification-token"),
    ]);

    assert.equal([firstResult, secondResult].filter(Boolean).length, 1);
    assert.equal(storedUser.verified, true);
    assert.equal("verificationToken" in storedUser, false);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }

  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.deepEqual(call.query, {
      verificationToken: "verification-token",
      verified: false,
    });
    assert.deepEqual(call.update, {
      $set: { verified: true },
      $unset: { verificationToken: 1 },
    });
    assert.deepEqual(call.options, { new: true });
  }
});
