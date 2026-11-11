import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeAuditPath, sanitizeObject } from "./audit.middleware.js";

test("audit paths redact verification tokens while retaining route context", () => {
    const path = sanitizeAuditPath(
        "/api/v1/users/verify/verification-secret?source=email&page=1",
    );

    assert.equal(
        path,
        "/api/v1/users/verify/[REDACTED]?source=email&page=1",
    );
    assert.equal(path.includes("verification-secret"), false);
});

test("audit paths redact sensitive query values and preserve ordinary values", () => {
    const path = sanitizeAuditPath(
        "/api/v1/posts?page=2&access_token=query-secret&category=design",
    );

    assert.equal(
        path,
        "/api/v1/posts?page=2&access_token=%5BREDACTED%5D&category=design",
    );
    assert.equal(path.includes("query-secret"), false);
});

test("audit object sanitization redacts token fields case-insensitively", () => {
    const sanitized = sanitizeObject({
        verificationToken: "verification-secret",
        nested: [{ access_token: "access-secret", label: "public" }],
    });

    assert.deepEqual(sanitized, {
        verificationToken: "[REDACTED]",
        nested: [{ access_token: "[REDACTED]", label: "public" }],
    });
});

test("ordinary audit paths remain unchanged", () => {
    assert.equal(
        sanitizeAuditPath("/api/v1/users/list?page=1&limit=20"),
        "/api/v1/users/list?page=1&limit=20",
    );
});
