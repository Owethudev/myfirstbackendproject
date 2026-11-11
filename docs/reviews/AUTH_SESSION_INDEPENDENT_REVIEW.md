# Authentication & Session Management — Independent Review

## 1. Executive summary

**Verdict: APPROVED WITH CONDITIONS.**

The implementation on `feature/auth-session-state-machine` correctly adds persisted-session active/expiry/owner checks, limits logout targets to the authenticated identity, and prevents ordinary users from selecting another profile-update target. No exploitable authentication bypass was identified in the reviewed changes. The implementation preserves admin cross-account profile updates and existing session/logout response shapes.

The main conditions before the next approval gate are:

1. Add integration-level tests that exercise JWT middleware through logout and protected routes, including authenticated success and cross-session attempts.
2. Obtain human confirmation of the retained admin ability to change another user's username, email, and password.
3. Before deployment, exercise successful login/session restoration/logout flows against an isolated non-production database. No such database-backed test was run in this review.

This review did not modify application source, tests, configuration, or dependencies; it did not connect to a database or deploy.

## 2. Scope, branch, and files reviewed

- Branch: `feature/auth-session-state-machine`
- HEAD: `29c5fab`, equal to `origin/main`; implementation changes are uncommitted in the worktree.
- Initial worktree included the implementation edits/tests and pre-existing untracked `docs/` audit materials. Those files were preserved.
- Compared all tracked worktree changes against `origin/main`, and read all new untracked test files. The implementation changes are limited to the following source/package files and three new tests; no frontend source or lockfile changed.

Reviewed:

- `backend/src/services/session.service.js`
- `backend/src/middleware/session.middleware.js`
- `backend/src/routes/user.route.js`
- `backend/src/controllers/user.controller.js`
- `backend/src/services/user.service.js`
- `backend/src/services/session.service.test.js`
- `backend/src/services/user.service.test.js`
- `backend/src/routes/user.route.test.js`
- `backend/package.json`
- Related `backend/src/app.js`, `backend/src/middleware/authorize.middleware.js`, `backend/src/models/session.model.js`, frontend `authService.ts` and `sessionManager.ts`, and the implementation report.

## 3. Security findings

### S-01 — Persisted session state and owner are enforced

**Severity: Informational (positive control); no vulnerability found.**

`backend/src/middleware/session.middleware.js:18-27` verifies the access token, then calls `getActiveSession(decoded.jti, decoded.id)`. `backend/src/services/session.service.js:53-70` rejects absent sessions, missing identity, inactive sessions, invalid/non-finite expiry values, expired sessions (expiry equal to now is rejected), and a session owner that does not match the JWT user ID. The middleware then loads the current user, rejects missing or suspended accounts, and derives role from the database (`session.middleware.js:27-44`). `backend/src/app.js:47-62` installs auth middleware before mounting routes.

This prevents an inactive, expired, wrong-owner, or deleted-user session from reaching protected route authorization. JWT validation remains delegated to `verifyAccessToken`, including signature/expiry verification.

### S-02 — Logout is bound to the authenticated principal

**Severity: Informational (positive control); no vulnerability found.**

`backend/src/routes/user.route.js:13` requires the `user` or `admin` role. `backend/src/controllers/user.controller.js:52-58` passes `req.user.id`, the middleware-derived `req.session.sessionId`, and only the logout-all boolean to the service. It does not use caller-supplied email/session IDs. `backend/src/services/user.service.js:134-145` requires a user and current session ID; logout-one calls `revokeSession(sessionId, userId)`, whose filter in `backend/src/services/session.service.js:25-39` includes session ID, user ID, and `active: true`. Logout-all updates only active sessions for the authenticated user (`session.service.js:42-50`).

**Logout-all requires a valid current session.** If the request has no current persisted session ID, the controller passes `undefined` and the service returns `401` before either revocation operation. With a valid session, the body flag can request revocation of the caller's own other sessions only. The client cannot choose a different target user or session through body or header fields.

### S-03 — Profile updates are owner-bound for ordinary users

**Severity: Informational (positive control); no vulnerability found for ordinary-user access.**

The controller passes `req.user` separately from the request body (`backend/src/controllers/user.controller.js:66-69`). `resolveProfileUpdateTargetId` in `backend/src/services/user.service.js:148-161` requires a supported authenticated role, binds ordinary users to their principal ID, and rejects a different requested ID. The update handler applies only `username`, `email`, and `password` (`user.service.js:164-190`); this endpoint does not accept a role update.

### S-04 — Retained administrator cross-account profile changes need explicit policy

**Severity: Medium (privileged-operation policy risk; not an auth bypass).**

An authenticated principal with the current database-derived `admin` role can still select another account ID in the update body (`backend/src/services/user.service.js:148-155`). This preserves the previous behavior, and the added test asserts it (`backend/src/services/user.service.test.js:17-22`). The action can change another user's username, email, or password; it cannot change the role through this handler. Compromise or misuse of an admin account could therefore alter credentials and disrupt account access. The behavior is role-gated, not client-role-gated, and is not a privilege escalation from an ordinary user.

**Human decision required:** document whether administrators are intentionally authorized to reset/change another user's password and email through this general profile endpoint, and whether such changes require audit or re-authentication controls. This review does not change the behavior.

### S-05 — Infrastructure errors are returned as authentication failures

**Severity: Low (reliability/observability; no access-control bypass identified).**

`backend/src/middleware/session.middleware.js:18-46` catches token verification, session database lookup, user lookup, and other errors together, returning `401 Session expired.`. During a database outage, valid users may be treated as signed out, and clients may clear local authentication. Access fails closed, so this is not an authorization bypass. Separating expected invalid credentials from infrastructure errors is recommended as a separate, compatibility-reviewed change.

## 4. Regression findings

### R-01 — Logout contract is stricter for old callers

**Severity: Medium (compatibility consideration).**

Logout now requires a valid bearer token and middleware-attached current session. A legacy caller that relied only on body email, body/header session ID, or invoked logout after losing its token will no longer revoke a server-side session. The current frontend sends a bearer token and retains `clearAuthState()` in `finally` (`frontend/myfullstack/src/services/authService.ts:41-58`), so local sign-out remains intact even when the network request fails. The route and success response shape are unchanged. Logout-all also requires the current session to remain valid. No deployed/older client compatibility check was performed.

### R-02 — Database expiry now gates requests independently of TTL cleanup

**Severity: Informational (intended behavior change).**

Session records with missing, invalid, expired, or inactive values now deny authentication instead of being accepted solely because their ID exists. This is the intended security correction and requires no schema migration. No existing database records were inspected; therefore, the percentage of historical records that meet the guard cannot be stated.

### R-03 — Other auth flows remain structurally unchanged

**Severity: Informational.**

Registration, verification, login, reset-password, frontend storage keys, and login response fields were not modified. The auth middleware still derives role from the current database user, so admin suspension/role changes continue to affect subsequent authenticated requests. No end-to-end account workflow or production behavior is claimed as verified.

## 5. Test quality findings

### T-01 — Missing end-to-end authenticated transition coverage

**Severity: Medium (verification gap).**

`backend/src/services/session.service.test.js:15-55` tests the pure session predicate and revocation-filter construction. It does not invoke repository update functions or prove that logout-one/all execute those filters against a session store.

`backend/src/services/user.service.test.js:9-45` checks profile-target selection and denial before repository access, and checks missing logout context. It does not test a successful self-update, successful logout-one/all, or that body-provided IDs cannot affect repository operations.

`backend/src/routes/user.route.test.js:7-52` injects `req.user`/`req.session` directly and tests route middleware denial. It does not exercise JWT creation/verification, session persistence, or the real `session.middleware.js` -> authorization -> controller -> service chain.

Recommended follow-up tests, before production deployment:

- A valid token with a matching active DB session succeeds; inactive, expired, wrong-owner, missing session, deleted user, and suspended user fail through the actual middleware.
- An authenticated logout-one revokes only the principal's current session; a forged body/header ID cannot change the target.
- Logout-all revokes only the principal's sessions and cannot run without a current session.
- Authenticated user self-update succeeds; cross-account update is denied without persistence; admin behavior follows the approved policy.

These are coverage gaps, not evidence that the implementation is vulnerable.

### Test commands independently rerun

| Command | Result |
|---|---|
| `npm test` from `backend` | Passed: 16 tests, 0 failures. |
| `npm test` from `frontend/myfullstack` | Passed: 6 tests, 0 failures. |
| `npm run lint` from `frontend/myfullstack` | Passed. |
| `npm run build` from `frontend/myfullstack` | Passed, including `tsc -b`; existing Vite chunk-size warning for the 539.02 kB Three.js scene remains. |
| `git diff --check` | Passed. |

No backend lint script is configured. No DB-backed integration tests, application server startup, or production workflow tests were performed; no safe isolated database configuration was confirmed.

## 6. API and database compatibility

- No route path, login response, logout success payload, profile-update success payload, or MongoDB schema was changed.
- Existing logout body fields may still be sent by clients, but email/session identifiers are ignored as authority; only `logoutAll` is read.
- Logout now requires a valid authenticated session and logout-all cannot run without the current session. Clients that used unauthenticated logout may need compatibility review.
- Session owner comparison uses stringified IDs and requires `expiresAt` to parse to a finite timestamp later than the current time. No data migration or database operation was performed.
- Frontend local logout still clears the stored user/token/session ID in `finally`, including when the remote call fails.
- Database-backed persistence and compatibility with historical session documents remain unverified.

## 7. Ranked issue summary

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Medium | Admin can change another account's username, email, and password | Existing behavior preserved; human policy confirmation required |
| 2 | Medium | Missing end-to-end authenticated logout/session/profile tests | Verification gap; address before production deployment |
| 3 | Medium | Logout now requires a valid current session, affecting legacy unauthenticated callers | Compatibility review recommended |
| 4 | Low | Database/token errors are conflated into `401 Session expired.` | Fail-closed reliability/observability issue |
| 5 | Informational | Persisted-session validity and ownership guards | Positive control; no defect found |

No Critical or High severity vulnerability was identified in the reviewed implementation.

## 8. Recommended corrective actions

1. Before deployment, add isolated integration tests for middleware-to-route authenticated success, denial, logout-one/all repository effects, and profile update persistence.
2. Obtain and document human approval for the retained administrator cross-account username/email/password update behavior.
3. Verify that supported clients submit the bearer token for logout; keep frontend local sign-out cleanup regardless of remote failure.
4. In a separate approved reliability task, distinguish invalid/expired credentials from database/infrastructure errors without leaking internal details.
5. Do not test against production or begin the next state machine until the owner approves the next gate.

## 9. Final verdict

**APPROVED WITH CONDITIONS.**

The reviewed server-side guards are correctly bound to verified JWT identity and persisted session ownership; no ordinary-user cross-account profile update or cross-user session revocation path was found in the changes. The remaining conditions are human confirmation of admin account-edit authority and stronger isolated integration coverage before deployment. This verdict does not certify production workflows and does not authorize implementation of registration/email verification or any other state machine.
