import assert from "node:assert/strict";
import test from "node:test";
import { User } from "../models/user.model.js";
import {
  buildVerificationTokenConsumeQuery,
  consumeUserVerificationToken,
} from "./user.repository.js";

test("verification token consume query allows valid and legacy expiry states only", () => {
  const now = new Date("2026-01-01T00:00:00.000Z");

  assert.deepEqual(
    buildVerificationTokenConsumeQuery("verification-token", now),
    {
      verificationToken: "verification-token",
      verified: false,
      $or: [
        { verificationTokenExpires: { $gt: now } },
        { verificationTokenExpires: null },
      ],
    },
  );
});

test("verification token is consumed atomically with the verified transition", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const now = new Date("2026-01-01T00:00:00.000Z");
  const initialUser = {
    verificationToken: "verification-token",
    verificationTokenExpires: new Date("2026-01-02T00:00:00.000Z"),
    verified: false,
  };
  let storedUser = { ...initialUser };
  const calls = [];

  User.findOneAndUpdate = async (query, update, options) => {
    calls.push({ query, update, options });

    if (
      storedUser.verificationToken !== query.verificationToken ||
      storedUser.verified !== query.verified ||
      !query.$or.some((condition) =>
        condition.verificationTokenExpires === null
          ? storedUser.verificationTokenExpires === null ||
            storedUser.verificationTokenExpires === undefined
          : storedUser.verificationTokenExpires >
            condition.verificationTokenExpires.$gt,
      )
    ) {
      return null;
    }

    storedUser = {
      ...storedUser,
      ...update.$set,
    };
    delete storedUser.verificationToken;
    delete storedUser.verificationTokenExpires;
    return { ...storedUser };
  };

  try {
    const [firstResult, secondResult] = await Promise.all([
      consumeUserVerificationToken("verification-token", now),
      consumeUserVerificationToken("verification-token", now),
    ]);

    assert.equal([firstResult, secondResult].filter(Boolean).length, 1);
    assert.equal(storedUser.verified, true);
    assert.equal("verificationToken" in storedUser, false);
    assert.equal("verificationTokenExpires" in storedUser, false);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }

  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.deepEqual(call.query, {
      verificationToken: "verification-token",
      verified: false,
      $or: [
        { verificationTokenExpires: { $gt: now } },
        { verificationTokenExpires: null },
      ],
    });
    assert.deepEqual(call.update, {
      $set: { verified: true },
      $unset: { verificationToken: 1, verificationTokenExpires: 1 },
    });
    assert.deepEqual(call.options, { new: true });
  }
});

test("expired and boundary-time tokens cannot be consumed", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const now = new Date("2026-01-01T00:00:00.000Z");
  const outcomes = [];
  const expiries = [new Date(now.getTime() - 1), new Date(now.getTime())];
  let callIndex = 0;

  User.findOneAndUpdate = async (query) => {
    const storedExpiry = expiries[callIndex++];
    const isEligible = query.$or.some((condition) =>
      condition.verificationTokenExpires === null
        ? storedExpiry === null || storedExpiry === undefined
        : storedExpiry > condition.verificationTokenExpires.$gt,
    );
    outcomes.push(isEligible);
    return isEligible ? { _id: "unexpected-user", verified: true } : null;
  };

  try {
    await consumeUserVerificationToken("expired-token", now);
    await consumeUserVerificationToken("boundary-token", now);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }

  assert.deepEqual(outcomes, [false, false]);
});

test("legacy pending tokens without an expiry remain consumable", async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const now = new Date("2026-01-01T00:00:00.000Z");
  const legacyUser = {
    verificationToken: "legacy-token",
    verified: false,
  };
  let actualQuery;

  User.findOneAndUpdate = async (query) => {
    actualQuery = query;
    const matchesLegacyExpiry = query.$or.some(
      (condition) =>
        condition.verificationTokenExpires === null &&
        (legacyUser.verificationTokenExpires === null ||
          legacyUser.verificationTokenExpires === undefined),
    );
    if (!matchesLegacyExpiry || legacyUser.verified) return null;

    legacyUser.verified = true;
    delete legacyUser.verificationToken;
    return { _id: "legacy-user", ...legacyUser };
  };

  try {
    const result = await consumeUserVerificationToken("legacy-token", now);
    assert.equal(result?._id, "legacy-user");
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }

  assert.equal(actualQuery.$or[1].verificationTokenExpires, null);
});
