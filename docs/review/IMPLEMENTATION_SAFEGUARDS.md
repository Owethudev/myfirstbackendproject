# Implementation Safeguards

These controls apply to any later, explicitly approved implementation. This document does not authorize code changes.

## Git protection

- Create a dedicated descriptive feature/fix branch from the current `origin/main`; do not use the already-integrated, 39-commits-behind `update` branch as a new implementation base.
- Start from a clean Git checkpoint. Preserve untracked/user work; never reset, overwrite, or remove files not created for the approved task.
- Keep changes small and independently reviewable; commit only requested files and include tests.
- Never commit directly to `main`, force-push shared branches, auto-merge, or merge the PR.
- Before and after each implementation batch, inspect the complete diff and `git status`.

## Testing protection

- Add regression tests before or alongside changes. Use existing Node `node:test` and frontend Vitest/Testing Library infrastructure.
- Unit-test each guard/transition, including valid, denied, expired, missing, and boundary cases.
- Add API integration tests for middleware -> route -> controller -> service behavior using deterministic fakes or an explicitly isolated test database.
- Test unauthorized transitions (cross-user profile/session/content access, non-admin actions, forged body identity).
- Run backend tests, frontend tests, configured lint, and frontend production build. Backend lint is not currently configured; do not claim it ran.
- Test UI loading, empty, error, partial-failure, and stale-response states for any async UI change.
- Do not use production accounts or infer workflow success from source files or UI rendering.

## Database protection

- Never connect validation to production Atlas or read/write production records.
- No destructive migrations, bulk updates, account/session deletion, or schema changes without explicit approval.
- Preserve existing user records and fields; use additive, backward-compatible changes where possible.
- Before a migration, define a representative fixture set, backup/restore procedure, migration idempotency, verification query, and rollback plan.
- Treat legacy username-only post/event authors and missing expiry values as explicit compatibility cases; do not invent mappings.

## Deployment protection

- No production deployment or automatic production deployment as part of refactoring.
- Verify non-production environment variables and service connectivity without exposing secret values.
- Confirm Netlify, Render, and Atlas configuration with authorized maintainers; repository configuration alone does not prove deployment health.
- Deploy only after explicit approval and successful review; use a staged/rollback plan and verify production workflows after deployment.

## Required implementation gates

Each priority must pass all gates before moving on:

1. Approved scope and unresolved-policy decisions.
2. Approved technical approach with affected files, tests, compatibility risks, and rollback.
3. Small implementation with no unrelated changes.
4. Relevant tests, lint/build where configured, and clean diff review.
5. Independent code review focused on security and regressions.
6. Human acceptance.
7. Separate explicit deployment approval.

Failing a gate means stop, document the blocker, and do not broaden scope.
