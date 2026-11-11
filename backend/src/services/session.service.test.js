import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSessionRevocationFilter,
  isUsableSession,
} from "./session.service.js";

const now = new Date("2026-01-01T00:00:00.000Z");
const validSession = {
  userId: "user-1",
  active: true,
  expiresAt: new Date("2026-01-01T00:00:01.000Z"),
};

test("active, unexpired sessions are accepted for their owner", () => {
  assert.equal(isUsableSession(validSession, "user-1", now), true);
});

test("inactive sessions are rejected", () => {
  assert.equal(isUsableSession({ ...validSession, active: false }, "user-1", now), false);
});

test("expired sessions and the expiry boundary are rejected", () => {
  assert.equal(
    isUsableSession({ ...validSession, expiresAt: now }, "user-1", now),
    false,
  );
  assert.equal(
    isUsableSession({ ...validSession, expiresAt: new Date(now.getTime() - 1) }, "user-1", now),
    false,
  );
});

test("sessions belonging to a different user are rejected", () => {
  assert.equal(isUsableSession(validSession, "user-2", now), false);
});

test("missing or invalid session state is rejected", () => {
  assert.equal(isUsableSession(null, "user-1", now), false);
  assert.equal(isUsableSession({ ...validSession, expiresAt: "invalid" }, "user-1", now), false);
  assert.equal(isUsableSession(validSession, null, now), false);
});

test("session revocation filters are scoped to the authenticated user", () => {
  assert.deepEqual(buildSessionRevocationFilter("user-1", "session-1"), {
    sessionId: "session-1",
    userId: "user-1",
    active: true,
  });
  assert.deepEqual(buildSessionRevocationFilter("user-1"), {
    userId: "user-1",
    active: true,
  });
  assert.equal(buildSessionRevocationFilter(null, "session-1"), null);
});
