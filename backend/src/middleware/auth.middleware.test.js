import assert from "node:assert/strict";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import test from "node:test";
import authMiddleware from "./auth.middleware.js";

const createMockResponse = () => {
  const response = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };

  return response;
};

test("expired JWTs return a consistent 401 session-expired payload", async () => {
  const req = {
    headers: {
      authorization: `Bearer ${jwt.sign({ id: "user-1" }, process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex"), { expiresIn: -1 })}`,
    },
  };
  const res = createMockResponse();
  let nextCalled = false;

  await authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { success: false, message: "Session expired." });
  assert.equal(nextCalled, false);
});
