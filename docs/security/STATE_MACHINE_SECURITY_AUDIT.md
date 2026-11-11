# SNPL PORT State-Machine Security Audit

## Scope

Static, source-based audit of state transitions and their access controls. This is not a production assessment, exploit test, dependency audit, or review of live MongoDB data. Findings are prioritized by likely impact and evidence confidence. No application code, credentials, or data were changed.

## Summary by severity

| Severity | Count | Summary |
|---|---:|---|
| Critical | 0 | No critical finding established by this static pass. |
| High | 2 | Revoked sessions remain accepted; post ownership/update authorization is not bound to the authenticated user. |
| Medium | 5 | Logout endpoint can revoke sessions using only an email; event/post identity spoofing; reset-token expiry not enforced; event ownership relies on body username; profile deletion UI/backend mismatch. |
| Low | 3 | Middleware errors are reported as session errors; reset does not revoke existing sessions (policy-dependent); async dashboard/feed states can be stale or ambiguous. |

Severity is assigned to the specific behavior evidenced, not to an overall system rating. “High” indicates a substantial account/session or data-integrity impact without evidence of broad unauthenticated privilege escalation.

## Findings

### SEC-01 — Revoked database sessions are not rejected

- **Severity:** High
- **Confidence:** High
- **Evidence:** `backend/src/middleware/session.middleware.js` verifies JWT and calls `getActiveSession(decoded.jti)`. `backend/src/services/session.service.js` delegates to `findSessionById`; `backend/src/repositories/session.repository.js` runs `Session.findOne({ sessionId })` without checking `active` or `expiresAt`. Logout only marks `active=false`; session TTL removal is asynchronous.
- **Impact:** A stolen, still-unexpired bearer token can remain accepted after logout or logout-everywhere because the revoked row still satisfies the lookup. Logout does not reliably terminate the token immediately.
- **Recommendation:** Make the middleware’s session guard require active and unexpired database state; preserve JWT validation and DB-derived user role. Add regression tests for revoked, inactive, expired, missing, and valid sessions.
- **Dependencies / compatibility:** Existing sessions already have `active` and `expiresAt` fields. Confirm all existing records are populated; no destructive migration is expected. Test production-equivalent records before deployment.

### SEC-02 — Post update and delete authorization is not tied to the authenticated owner

- **Severity:** High
- **Confidence:** High
- **Evidence:** `backend/src/routes/post.route.js` allows any `user` or `admin` to call update/delete. `backend/src/controllers/post.controller.js` passes `req.params.id` and `req.body` to services without authenticated identity. `backend/src/services/post.service.js` updates the entire payload via repository update; delete compares body `username` to `post.author`.
- **Impact:** An authenticated user can update another user's post by ID; update can include fields such as `author` and moderation fields. Delete ownership can be forged by sending the stored author name in the body.
- **Recommendation:** Pass authenticated principal to service; enforce owner-or-admin rules server-side; validate update fields with an explicit allowlist. For ownership, decide how legacy posts (only string author) map to user identity before changing schema or behavior.
- **Dependencies / compatibility:** Existing post model has no immutable owner ID. A safe rollout must retain current records and establish a compatibility approach; do not backfill or alter production data without an approved migration plan.

### SEC-03 — Logout can revoke sessions using unauthenticated email input

- **Severity:** Medium
- **Confidence:** High
- **Evidence:** `backend/src/routes/user.route.js` declares `/logout` without `authorize`. Global `sessionMiddleware` permits requests without an Authorization header. `backend/src/controllers/user.controller.js` forwards body email/session ID/logoutAll. `backend/src/services/user.service.js` revokes all sessions when logoutAll is true **or sessionId is missing**, and otherwise revokes a session by ID without verifying it belongs to the supplied email or current principal.
- **Impact:** A caller who knows a user's email can revoke all sessions by omitting session ID or setting logoutAll, causing targeted account disruption. A supplied session ID is not associated with the authenticated user before revocation.
- **Recommendation:** Require a valid authenticated session for one-session logout and derive session/user identity from `req.user`/`req.session`. Make logout-all explicitly authenticated and deliberate. Preserve client local cleanup even if remote logout fails.
- **Dependencies / compatibility:** Frontend currently sends email/session ID/logoutAll. Update client and tests together; do not retain unauthenticated email as authority.

### SEC-04 — Project and event author identity is client-controlled

- **Severity:** Medium
- **Confidence:** High
- **Evidence:** Post/event routes require user/admin role, but create controllers pass raw body to services. `createPost` and `createEventPost` accept `author` from payload and persist it; frontend also submits `user.username`.
- **Impact:** Any authenticated user can publish content attributed to another username, undermining identity and moderation records.
- **Recommendation:** Set author from authenticated `req.user` server-side and ignore client-supplied identity. Add tests that attempt to spoof author.
- **Dependencies / compatibility:** Stored author is a string; use existing authenticated username for a minimal-compatible fix. An immutable user-ID ownership model is a separate schema migration requiring approval.

### SEC-05 — Event deletion ownership is based on a client-supplied username

- **Severity:** Medium
- **Confidence:** High
- **Evidence:** Event delete route requires a user/admin role, but controller passes request body to service; service compares body username with persisted string author.
- **Impact:** Any authenticated caller can delete an event by supplying its current author username.
- **Recommendation:** Compare `req.user` identity server-side and apply an explicit admin override only if intended. Test owner, non-owner, unauthenticated, and admin cases.
- **Dependencies / compatibility:** As with posts, event records use string author with no owner ID; preserve records and document legacy matching or approved migration strategy.

### SEC-06 — Password-reset expiry is recorded but not enforced by token lookup

- **Severity:** Medium
- **Confidence:** High
- **Evidence:** `backend/src/services/auth.service.js` stores `resetPasswordExpires = Date.now() + 15 minutes`. `backend/src/repositories/user.repository.js` implements `findUserByResetToken(token)` as token-only `User.findOne`; reset service accepts any matching result.
- **Impact:** Reset tokens can remain valid past the stated 15-minute period until cleared or replaced.
- **Recommendation:** Require `resetPasswordExpires > now` in the database lookup or a service guard. Test valid, expired, missing, replaced, and consumed tokens.
- **Dependencies / compatibility:** Expiry field already exists. Existing tokens with missing expiry should be treated as invalid unless product/security approval specifies a compatibility grace period; do not migrate or bulk-clear users.

### SEC-07 — User-facing account deletion is inconsistent with backend authorization

- **Severity:** Medium (functional/security-boundary mismatch)
- **Confidence:** High
- **Evidence:** `frontend/myfullstack/src/App.tsx` sends a user email to `/api/v1/users/delete` from profile UI. `backend/src/routes/user.route.js` protects that route with `authorize("admin")`.
- **Impact:** A normal user sees a delete-profile action that cannot succeed. The backend's admin guard currently prevents the UI from becoming an unauthenticated self-delete operation, and should not be loosened based solely on frontend intent.
- **Recommendation:** Ask product owner whether self-service deletion is intended. If so, define authenticated self-delete with identity derived from session; otherwise remove/disable the misleading UI only after approval.
- **Dependencies / compatibility:** Behavior decision required; keep current admin authorization until approved.

### SEC-08 — Password reset leaves other access sessions active

- **Severity:** Low / policy-dependent
- **Confidence:** High
- **Evidence:** `backend/src/services/auth.service.js` saves the new password and clears reset fields but does not call session revocation service.
- **Impact:** Previously issued access tokens continue to work until expiry, especially relevant while SEC-01 remains unresolved.
- **Recommendation:** Recommend revoking all sessions on successful password reset; this changes expected session persistence and requires product confirmation. SEC-01 must be fixed for revocation to take effect immediately.
- **Dependencies / compatibility:** Coordinate with frontend message/redirect expectations. Add integration test for existing sessions after reset if approved.

### SEC-09 — Session middleware converts unexpected infrastructure errors into 401

- **Severity:** Low
- **Confidence:** High
- **Evidence:** `backend/src/middleware/session.middleware.js` catches verification, database, and user lookup errors together and returns `401 Session expired`.
- **Impact:** MongoDB/service failures are presented as invalid authentication, causing clients to clear auth and making outages harder to distinguish and recover from.
- **Recommendation:** Keep fail-closed behavior, but separate expected invalid-token/session errors from dependency failures; log and return a suitable server error for infrastructure failures without exposing internals.
- **Dependencies / compatibility:** API status behavior may change for infrastructure errors; add tests and confirm frontend behavior before deployment.

### SEC-10 — Feed and admin async state can misrepresent request outcomes

- **Severity:** Low
- **Confidence:** Medium-high
- **Evidence:** `App.tsx` feed loaders catch and clear item arrays, making request failure appear as empty results. `AdminDashboard.tsx` loads three resources concurrently but sets general loading false when reported-post request settles; one shared error string receives multiple request errors; search requests are not cancelled.
- **Impact:** Temporary failures or out-of-order responses can display stale/empty data as if it were current.
- **Recommendation:** Track loading/error/empty per resource, coordinate latest-search results, and test partial failures. Keep existing API response contracts.
- **Dependencies / compatibility:** Frontend-only; no security boundary changes.

## Positive controls observed

- `authorize.middleware.js` rejects missing `req.user` and checks allowed roles.
- Admin routes for user listing, role/status changes, stats, reports, post review, and admin deletion use server-side role authorization.
- `session.middleware.js` fetches the user from MongoDB and overwrites role claims with the current database role; it rejects suspended accounts.
- Login checks email/password, email verification, and suspension before creating a session.
- Signup, login, and forgot-password routes have dedicated rate limiters; the app also applies a general API limiter.
- Password reset tokens are random and stored hashed; email response for forgot-password is generic for existing vs unknown emails.
- User list repository projection excludes password and sensitive token fields.

These controls do not offset the specific findings above.

## Recommended remediation order

1. SEC-01: enforce session active/expiry state; add tests.
2. SEC-02, SEC-05: authorize post/event ownership from authenticated server identity; preserve data compatibility.
3. SEC-03: authenticate and bind logout operations to the active principal/session.
4. SEC-06: enforce reset expiry.
5. SEC-04: derive content author from the authenticated user.
6. Resolve SEC-07 and SEC-08 product decisions before changing behavior.
7. Address SEC-09/SEC-10 reliability improvements after security-sensitive transition tests are in place.

No finding has been silently fixed in this audit phase.
