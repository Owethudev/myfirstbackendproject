# Async Workflow Reliability — Implementation Report

## Status

Implemented on `feature/async-workflow-reliability`, based on `main` at `2e3f8d3`. Scope is limited to password-reset email delivery failure handling and the existing forgot-password page's loading, failure, and retry experience.

No comments feature, notification queue, background job system, database migration, deployment, environment change, or dependency was added.

## State machine completed

- **Invalid email input:** retains the existing validation error; no account lookup or email attempt occurs.
- **Unknown account:** returns the same generic accepted response without attempting email delivery.
- **Known account, email accepted by provider:** returns the same generic response.
- **Known account, email delivery fails:** logs a generic server-side failure signal and returns the same generic response as the unknown-account path. Provider error details are not returned to the caller or written to this log.
- **Retry after delivery failure:** allows another request, which saves a newly hashed reset token and expiry before attempting delivery. This replaces the prior token, so only the newest reset link can work.
- **Frontend transport failure:** shows an accessible alert, retains the entered email, re-enables submission, and lets the user retry.
- **Frontend accepted response:** shows accessible status feedback and clears the email input. Copy explains that a replacement request invalidates earlier reset links.

Keeping known and unknown account outcomes identical preserves the documented anti-enumeration policy. The UI does not claim delivery is certain; it tells users how to recover if no email arrives.

## Files changed

- `backend/src/services/auth.service.js` — keeps forgot-password outcomes generic on email-provider failures and records a non-sensitive failure signal.
- `backend/src/services/auth.service.test.js` — verifies response equivalence, absence of provider details, token replacement, and retry behavior.
- `frontend/myfullstack/src/components/ForgotPasswordPage.tsx` — clarifies delivery uncertainty and the newest-link rule; adds accessible live-region roles.
- `frontend/myfullstack/src/components/ForgotPasswordPage.test.tsx` — tests loading, accepted response, network failure, retained input, retry, and request contract.
- `docs/architecture/REFACTORING_ROADMAP.md` — records the implemented subset and remaining product decisions.
- `docs/review/ASYNC_WORKFLOW_RELIABILITY_IMPLEMENTATION_REPORT.md` — documents implementation, validation, and limitations.

## Previous and new behavior

Previously, a registered address whose email send failed received HTTP 500 and a response containing the provider error message, while an unknown address received HTTP 200 with a generic message. That discrepancy contradicted the documented generic-response policy and could reveal account existence; provider details could also leak to callers.

Both outcomes now retain the existing generic accepted status and response shape. A provider failure is recorded as a generic server-side error without provider details. A user can retry from the existing form; each request replaces the stored reset token.

The forgot-password page already tracked loading, success, and error states. It now exposes these feedback states accessibly, documents retry behavior, and has tests that verify the actual request and recovery behavior.

## Tests and validation

### Baseline before implementation

- Backend `npm test`: passed, 36 tests.
- Frontend `npm test`: passed, 20 tests.
- Worktree was clean before implementation.

### After implementation

- Backend `npm test`: passed, 37 tests, 0 failures.
- Backend CI lint command `npm run lint --if-present`: passed; no backend lint script is configured.
- Frontend `npm test`: passed, 22 tests, 0 failures.
- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed; TypeScript check succeeded. The existing 539 kB `OrbitalScene` chunk-size warning remains.
- `git diff --check`: passed.

The tests mock persistence and provider delivery. No MongoDB-backed workflow, external email delivery, browser-driven production workflow, or deployment was exercised.

## Compatibility, security, and remaining risks

- Routes, methods, request bodies, response JSON shape, token hashing, 15-minute expiry, and rate limiting remain unchanged.
- Provider failure now returns the same HTTP status and generic message as unknown-account requests. This intentionally changes the prior failure-specific response to preserve anti-enumeration; the UI directs users to retry if no email arrives.
- A retry replaces the previous token even if delivery failed again. Only the newest token remains usable.
- Server logs deliberately omit provider error details to avoid logging potentially sensitive external response content; detailed provider diagnostics are not available from this catch path.
- Response status and body are now identical for known and unknown addresses, but request timing can still differ because only known accounts trigger email delivery. This change does not claim to eliminate timing-based account enumeration.
- Registration still deletes a newly created account when its verification email fails. That destructive retention behavior was intentionally left unchanged pending a separate product/security decision.
- The community post and event feeds already have explicit loading, empty, retryable error, and stale-response handling; no duplicate implementation was made.
- Comments and notification/background queues remain out of scope because those features are not present in the repository and have no approved product specification.

## Suggested commit message

`fix(auth): keep reset email failures generic`

## Recommended next step

Review the registration email-failure account-retention policy and decide whether comments or notification processing are product requirements before expanding Priority 7.
