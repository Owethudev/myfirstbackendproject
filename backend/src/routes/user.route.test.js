import assert from "node:assert/strict";
import express from "express";
import test from "node:test";
import userRouter from "./user.route.js";

const requestAs = async (principal, path) => {
  const app = express();
  app.use((req, res, next) => {
    req.user = principal;
    req.session = principal ? { sessionId: "session-1" } : null;
    next();
  });
  app.use("/api/v1/users", userRouter);

  const server = app.listen(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");

    return await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: path.endsWith("/logout") ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

test("logout requires an authenticated user or admin", async () => {
  const response = await requestAs(null, "/api/v1/users/logout");

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), {
    success: false,
    message: "Session expired.",
  });
});

test("profile update rejects unauthenticated and unsupported principals", async () => {
  const unauthenticatedResponse = await requestAs(null, "/api/v1/users/update");
  assert.equal(unauthenticatedResponse.status, 401);

  const guestResponse = await requestAs(
    { id: "guest-1", role: "guest" },
    "/api/v1/users/update",
  );
  assert.equal(guestResponse.status, 403);
});
