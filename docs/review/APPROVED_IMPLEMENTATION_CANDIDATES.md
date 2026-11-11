# Implementation Candidates

## Status

These are evidence-based candidates, not authorization to modify application code. The required approval gate remains in force. The generic order in the prior roadmap should be adjusted because the audit found an additional profile-update authorization gap with potential credential impact. Do not implement comments or a notification queue: neither feature is evidenced in source.

## Priority 1 — Protect profile updates and active sessions

- **Scope:** Bind profile updates to the authenticated user; enforce session active/expiry state; bind one-session and logout-all operations to the authenticated principal.
- **Confirmed problems:** `/users/update` accepts a caller-selected account ID; session lookup ignores `active` and `expiresAt`; logout is unauthenticated and accepts body-selected email/session ID/logout-all.
- **Expected improvement:** Prevent cross-account profile changes and make persisted revocation/expiry meaningful.
- **Potential files:** `backend/src/routes/user.route.js`, `backend/src/controllers/user.controller.js`, `backend/src/services/user.service.js`, `backend/src/middleware/session.middleware.js`, `backend/src/services/session.service.js`, `backend/src/repositories/session.repository.js`, `frontend/myfullstack/src/services/authService.ts`.
- **Dependencies:** Clarify whether administrators may update another user's profile through `/update`; confirm historical session records contain required fields. No database schema change expected.
- **Tasks:** Add isolated tests first; derive the profile target from `req.user` or deny mismatched IDs; query only active/non-expired sessions; authorize logout from current session/principal; keep local sign-out in `finally`; preserve response contracts.
- **Required tests:** self profile update; cross-account profile denial; approved admin behavior; password hashing; active/revoked/expired/missing session; expiry boundary; logout one/all; cross-user session ID; no-auth logout.
- **Acceptance:** Ordinary user cannot mutate another account; valid sessions continue to work; revoked/expired sessions fail next protected request; logout cannot revoke another user's session; local sign-out still happens after network failure.
- **Regression risk:** Older clients may send profile ID and logout data in the body; session records may be inconsistent. Validate against representative test records before production.
- **Rollback:** Revert only the authorization/session feature commit; no user/session data deletion or migration.

## Priority 2 — Post and event ownership/field authorization

- **Scope:** Derive create authorship from authenticated principal; enforce owner/admin rules for mutation; allowlist mutable post fields.
- **Confirmed problems:** Body-controlled author and delete username; post update has no owner guard and forwards whole body.
- **Expected improvement:** Protect content integrity and prevent spoofed ownership/moderation edits.
- **Potential files:** `backend/src/routes/post.route.js`, `backend/src/controllers/post.controller.js`, `backend/src/services/post.service.js`, `backend/src/repositories/post.repository.js`, corresponding `eventpost` route/controller/service files, and `frontend/myfullstack/src/App.tsx` only where request contract coordination is required.
- **Dependencies:** Decide how legacy username-only authors map to a user after username changes; define any admin override. No schema migration in initial scope.
- **Tasks:** Add service/route tests; pass authenticated principal through controller/service; deny forged owner identity; allowlist user-editable fields; turn on appropriate update validation without altering moderation workflow.
- **Required tests:** owner/non-owner/admin matrix, forged author on create/delete, protected-field update, invalid model values, existing legacy author fixture, public feed and moderation behavior.
- **Acceptance:** A user cannot create attributed content as another account or mutate another user's content; authorized existing behavior remains.
- **Regression risk:** Legacy names may not uniquely identify owners. Do not guess or silently backfill.
- **Rollback:** Revert code only; preserve all content records.

## Priority 3 — Password recovery expiry and token hygiene

- **Scope:** Enforce existing reset expiry and prevent token-bearing URL data from persisting in new audit logs.
- **Confirmed problems:** Hashed reset-token lookup omits expiry; audit middleware stores original URL, including verification-token path segments.
- **Expected improvement:** Expired recovery tokens fail; sensitive path values are not retained in future audit records.
- **Potential files:** `backend/src/repositories/user.repository.js`, `backend/src/services/auth.service.js`, `backend/src/middleware/audit.middleware.js`, with tests near existing backend tests.
- **Dependencies:** Decide behavior for missing reset-expiry fields and audit retention; no historical log or user data rewrite.
- **Tasks:** Add expiry predicate or explicit guard; ensure missing/expired fields fail closed; redact only the token segment while retaining route context.
- **Required tests:** valid/expired/missing/replaced/consumed reset token; token hash unchanged; generic forgot-password response; audit records omit verification token while retaining non-secret URL context.
- **Acceptance:** Expired/missing expiry token cannot change password; valid token remains single-use; new audit logs contain no verification token.
- **Regression risk:** Legacy token records with no expiry will be rejected; audit query context may change.
- **Rollback:** Revert predicate/redaction code only; do not restore or edit historical secrets/logs.

## Priority 4 — Registration and verification lifecycle

- **Scope:** Add only policy-approved verification expiry/resend/retry behavior.
- **Confirmed problems:** Verification has no expiry; registration removes the account on email failure. These facts do not by themselves define the desired behavior.
- **Expected improvement:** Explicit, testable pending-verification transitions without accidental account loss.
- **Potential files:** `backend/src/services/user.service.js`, `backend/src/models/user.model.js`, `backend/src/repositories/user.repository.js`, `backend/src/controllers/user.controller.js`, `backend/src/routes/user.route.js`, frontend auth components.
- **Dependencies:** Approval for expiry duration, legacy pending accounts, repeat verification, resend, and email-failure retention.
- **Tasks:** Document transition rules and account compatibility; add tests before a model change; implement only approved policy.
- **Required tests:** new/duplicate registration, email success/failure, valid/expired/repeated verification, login before/after verification, legacy account without expiry.
- **Acceptance:** Existing verified and pending accounts behave per approved rules; no unapproved deletion or account lockout.
- **Regression risk:** Changing email delivery side effects or adding required schema fields.
- **Rollback:** Prefer additive fields and tolerant reads; no bulk account changes without separate approval and backup.

## Priority 5 — Admin reliability and audit safety

- **Scope:** Make admin resource loading/search/mutations reflect per-request outcomes; retain server authorization.
- **Confirmed problems:** Shared loading/error state, out-of-order search possibility, audit path token retention.
- **Expected improvement:** Correct partial-failure display and current search results without weakening admin access.
- **Potential files:** `frontend/myfullstack/src/components/AdminDashboard.tsx`, `backend/src/middleware/audit.middleware.js`, and admin tests.
- **Dependencies:** Prioritize backend authorization fixes first; no new state-management dependency.
- **Tasks:** Add component tests for partial failure and search ordering; isolate per-resource status only where needed; validate mutation responses before local update.
- **Required tests:** non-admin server denial, partial stats/users/reports failures, stale search ordering, failed mutation, token redaction.
- **Acceptance:** Server remains the authority; stale data cannot replace newer search; errors are not represented as successful empty data.
- **Regression risk:** Loading presentation and partial data behavior change.
- **Rollback:** Revert the narrowly scoped UI or logger change only.

## Priority 6 — Explicit product decisions / unsupported features

- **Scope:** Resolve the profile-deletion UI/backend mismatch and password-reset session policy. Confirm whether comments or notification processing are actually desired.
- **Confirmed problems:** Profile UI exposes an operation the admin-only route rejects; reset does not revoke sessions. Comments/notification queue are not evidenced.
- **Expected improvement:** Avoid implementing inferred policy or nonexistent features.
- **Potential files:** No files until decisions are approved; depending on decision, user UI/routes/service or reset/session service.
- **Dependencies:** Explicit product/security approval.
- **Tasks:** Record intended policy; if approved, separate user experience and server policy changes with their own tests.
- **Required tests:** Self-delete versus admin-delete authorization and retention; password reset with active sessions; no feature tests until feature scope exists.
- **Acceptance:** UI action matches server policy; no unauthorized deletion; session policy is explicit.
- **Regression risk:** Account/data deletion is destructive; changing sessions can sign out users.
- **Rollback:** No deletion or deployment without approval; code-only rollback cannot restore deleted user data.

## Dependency order

Priority 1 is first because it includes account-level authorization and session invalidation. Priority 2 follows because content mutation has separate legacy-owner compatibility. Priority 3 is a narrow existing-token security fix. Priorities 4 and 6 require product policy. Admin UI reliability follows server-side security guards. No comments or notification feature should be introduced without an approved product request.
