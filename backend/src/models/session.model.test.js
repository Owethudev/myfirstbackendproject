import assert from "node:assert/strict";
import test from "node:test";
import { Session } from "./session.model.js";

test("session records do not define unused request metadata fields", () => {
  assert.equal(Session.schema.path("userAgent"), undefined);
  assert.equal(Session.schema.path("ipAddress"), undefined);
});
