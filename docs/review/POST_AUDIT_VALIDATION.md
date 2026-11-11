# Post-Audit Validation

## Scope and method

This is a read-only source review of the six prior documents under `docs/architecture/`, `docs/security/`, and `docs/testing/`. I checked their important claims against the checked-out source and `origin/main`. The current `update` branch is 39 commits behind `origin/main`, but `git diff HEAD origin/main -- backend/src frontend/myfullstack/src` is empty: the frontend and backend source used for these findings match mainline. This is static validation, not a penetration test or a test of live services or production records.

No application code, configuration, dependencies, environment values, database, or deployment were changed. No environment values were read or reproduced.

## Finding-by-finding verification

| Prior finding | Classification | Evidence and independent assessment |
|---|---|---|
| SEC-01: revoked sessions remain accepted | Confirmed | `session.middleware.js` verifies the JWT and calls `getActiveSession`; `session.repository.js` looks up only by `sessionId`. It does not filter `active` or `expiresAt`, while logout marks the row inactive. A revoked but unexpired JWT can therefore still pass the database-session lookup. High severity is justified. |
| SEC-02: post update/delete is not owner-bound | Confirmed | `post.route.js` permits `user` and `admin`; `post.controller.js` passes only the ID and body; `post.service.js` updates the full payload without an owner guard and compares the request-body username for delete. This enables cross-owner mutation and forged author-based deletion. High severity is justified. |
| SEC-03: logout trusts caller-supplied email/session data | Confirmed | `user.route.js` has no `authorize` middleware on `/logout`; global session middleware permits requests without an Authorization header. `user.controller.js` forwards body email, session ID, and logout-all; `user.service.js` revokes all sessions when `logoutAll` is true or no session ID is supplied, otherwise revoking the supplied ID without binding it to that email or principal. Medium severity is reasonable because the demonstrated impact is session disruption, not account takeover. |
| SEC-04: post/event author is client-controlled | Confirmed | Create routes require a role, but controllers forward `req.body` and both services persist `author` from the supplied payload. Medium severity is reasonable: attribution and moderation integrity are affected. |
| SEC-05: event deletion trusts body username | Confirmed | Event deletion is role-gated but controller/service use the supplied username to compare against the string author. A different authenticated user can claim that username. Medium severity is reasonable. |
| SEC-06: reset-token expiry is not enforced | Confirmed | `auth.service.js` stores a 15-minute expiry, but `user.repository.js` looks up only by hashed reset token and `resetPassword` does not check the expiry field. Medium severity is reasonable; the existing expiry data can be used without a destructive migration. |
| SEC-07: user profile delete UI conflicts with admin-only route | Requires clarification | The observation is correct: the normal profile UI calls `/api/v1/users/delete`, while the route requires `admin`; the client also clears its local state after a failed response. This is a functional mismatch, not itself a security vulnerability. Whether self-service deletion is intended is a product decision. Do not weaken the backend guard based on the UI. |
| SEC-08: password reset does not revoke sessions | Requires clarification | The behavior is confirmed, but whether a successful reset should terminate sessions is a security/product policy decision. The impact is amplified by SEC-01; adding revocation before session validation is reliable would not deliver the expected immediate result. The prior low/policy-dependent label is appropriate. |
| SEC-09: middleware maps infrastructure errors to 401 | Confirmed | `session.middleware.js` catches token verification, session lookup, and user lookup errors together and returns `401 Session expired`. This obscures database/service failure and may cause the client to clear local authentication. Low severity is reasonable as a reliability/observability issue. |
| SEC-10: async feed/admin state can misrepresent results | Partially confirmed | Feed load errors are caught and item arrays are cleared, conflating failure with empty results. `AdminDashboard.tsx` shares error state across concurrent resource loads and marks the dashboard non-loading when reported posts settle, regardless of stats/users. Search requests are not cancelled, allowing out-of-order results. The reliability concern is valid; the exact scope should be tested per resource before changes. Low severity is reasonable. |

No two prior SEC findings are exact duplicates. SEC-04/05 address different event transitions from the post update/delete and create transitions in SEC-02/04. Some share a root cause (untrusted client identity), but should retain distinct route-level tests.

The original severity totals accurately reproduce the labels in that document, but they overstate the count of security vulnerabilities: SEC-07 is a UI/backend behavior mismatch, SEC-08 is policy-dependent, and SEC-09/10 are reliability findings. They should not be reported as five confirmed medium security vulnerabilities without that qualification.

## Additional finding missed by the prior audit

### VA-01: Profile update accepts a caller-selected account ID

**Classification:** Confirmed. **Suggested severity:** High, subject to normal access to a target user's ID.

`user.route.js` protects `/update` only with `authorize("user", "admin")`. The controller forwards the request body to `updateUserService`; `user.service.js` accepts `id`, loads that account, and applies supplied username, email, or password without comparing the target ID with the authenticated principal. The frontend sending its own ID does not enforce authorization. A signed-in user who can obtain another user's ID can change that account's profile credentials, including its password. This conflicts with the repository instruction that server-side authorization must not trust the frontend.

Implement a server-derived identity/ownership guard and test self-update, cross-account denial, and any intentionally retained administrator behavior. Do not infer the administrator policy: the route currently admits admins and the separate admin operations do not establish whether admins are meant to edit credentials through this endpoint.

## Other corrections and additional observations

- **JWT expiry parser note: Partially confirmed if interpreted as JWT fallback.** `parseExpiryToMilliseconds` falls back to 30 minutes for unsupported values when computing the database session `expiresAt`; `signAccessToken` separately passes raw `JWT_ACCESS_TOKEN_EXPIRY` to `jsonwebtoken`. The JWT itself does not use this parser fallback. The real risk is that invalid configuration can make the database expiry disagree with JWT expiry or cause token signing to fail. Validate the configured format and test both values together; do not describe this as a silent JWT-expiry fallback.
- **Credential enumeration: Confirmed, low.** `loginUser` returns different messages for an unknown email and a wrong password; registration also distinguishes an existing account. Login and signup rate limits exist, and forgot-password response is generic. Consider uniform login failure responses if policy approves.
- **Audit URL retention: Confirmed observation, low.** `audit.middleware.js` stores `req.originalUrl` and redacts sensitive body keys but does not scrub path segments. `/verify/:token` places a verification token in the URL. Verification is one-use and clears the token after success, limiting replay after successful verification, but URL logging should still be treated as secret retention and addressed with a safe redaction test.
- **Positive controls confirmed:** the authorization middleware checks the current `req.user` role; the session middleware loads the user and replaces the token role with the database role, and blocks suspended users; admin-only user-management/audit routes are guarded; forgot-password response is generic; reset tokens are hashed; password/reset fields are excluded from user list projections. These controls do not resolve the gaps above.
- **Inventory scope:** the inventory correctly notes no comment model/routes or interaction lifecycle in source. The `totalComments` admin statistic is a constant `0`, not evidence of a comments feature. Email sends are inline awaited calls; no queue/retry state is evidenced.

## Recommended source-file references

- Session/logout: `backend/src/middleware/session.middleware.js`, `backend/src/services/session.service.js`, `backend/src/repositories/session.repository.js`, `backend/src/routes/user.route.js`, `backend/src/controllers/user.controller.js`, `backend/src/services/user.service.js`.
- Profile authorization: `backend/src/routes/user.route.js`, `backend/src/controllers/user.controller.js`, `backend/src/services/user.service.js`.
- Posts/events: `backend/src/routes/post.route.js`, `backend/src/controllers/post.controller.js`, `backend/src/services/post.service.js`, and corresponding `eventpost` route/controller/service files.
- Recovery: `backend/src/services/auth.service.js`, `backend/src/repositories/user.repository.js`, `backend/src/models/user.model.js`.
- Async UI: `frontend/myfullstack/src/App.tsx`, `frontend/myfullstack/src/components/AdminDashboard.tsx`.
- Audit logging: `backend/src/middleware/audit.middleware.js`, `backend/src/routes/user.route.js`.

This validation does not authorize implementation. The user must explicitly approve any application-code changes.
