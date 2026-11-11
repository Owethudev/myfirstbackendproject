# Password Recovery Expiry — Implementation Report

## Status

Implemented on `feature/auth-session-state-machine` as the next approved candidate after authentication/session and post/event ownership. Scope is limited to enforcing the existing password-reset expiry. No registration/verification, audit middleware, UI, schema, or response contract changes were made.

No commit, push, merge, database connection, migration, deployment, or environment change was made.

## State machine completed

- **Request reset:** unchanged. Existing code stores a hashed random token and a 15-minute expiry and returns the same generic forgot-password success response for existing and unknown email addresses.
- **Reset with a valid token:** accepted only when the token hash matches and `resetPasswordExpires` is strictly greater than the lookup time. Existing password-save, token clearing, and success response remain unchanged.
- **Missing, null, expired, or boundary-time expiry:** token lookup returns no user; reset returns the existing `400 Invalid or expired reset token.` response and does not proceed to password save.
- **Consumed/replaced token:** existing single-use/replacement behavior remains because the token is cleared on success and a later request stores a different hash.

The database schema already contains `resetPasswordExpires`; no migration or data change is needed. Historical reset tokens with missing expiry are rejected by the query. This is fail-closed and may invalidate legacy outstanding reset links, but does not affect accounts or passwords.

## Files changed for this state machine

- `backend/src/repositories/user.repository.js` — query now requires `resetPasswordExpires: { $gt: now }`; exported the small query builder for deterministic tests.
- `backend/src/repositories/user.repository.test.js` — verifies the query shape and that the repository uses the expiry predicate.

Earlier state-machine changes remain in the worktree and were not altered in this task.

## Tests and validation

### Baseline before this state machine

- Backend `npm test`: passed, 19 tests.
- Frontend `npm test`: passed, 6 tests.
- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed; TypeScript check succeeded. Existing Three.js chunk-size warning was emitted.

### After implementation

- Backend `npm test`: passed, 21 tests, 0 failures.
- Frontend `npm test`: passed, 6 tests, 0 failures.
- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed; TypeScript check succeeded. Same existing Three.js chunk-size warning.
- `git diff --check`: passed.

The new tests validate that the repository uses the `$gt` expiry filter. They do not execute MongoDB's query engine or reset a password against persisted data.

## Existing/new failures and workflow verification

- No test, lint, or build failures were observed.
- No baseline failures were observed in the executed checks.
- No live reset-email or persisted password-reset workflow was exercised. The backend startup path connects to MongoDB; no isolated test database was confirmed.
- Password hashing and token consumption behavior were not changed.
- No production records, credentials, or email services were accessed.

## Compatibility, security, and remaining scope

- The reset API route, request/response shapes, generic forgot-password behavior, token hashing, 15-minute duration, and existing password validation are unchanged.
- Missing/expired reset expiry is now rejected. No schema or historical document was modified.
- Audit-log URL token redaction was not included: although listed with token hygiene in the candidate, it is a separate cross-cutting audit-logging concern rather than part of the password-reset state machine. Historical audit data was not read or rewritten.
- Password-reset session revocation remains a separate policy-dependent behavior and was not changed.

## Suggested commit message

`fix(auth): reject expired password reset tokens`

No commit was created. Stop here and wait for approval before beginning registration/email verification, audit-log hardening, or another state machine.
