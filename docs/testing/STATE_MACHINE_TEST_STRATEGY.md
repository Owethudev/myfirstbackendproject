# SNPL PORT State-Machine Test Strategy

## Existing test infrastructure

- **Backend:** Node's built-in `node:test` and `node:assert/strict`; `backend/package.json` runs `node --test src/app.test.js`. A middleware unit test exists at `backend/src/middleware/auth.middleware.test.js`, discoverable with `node --test` from `backend/`.
- **Frontend:** Vitest, jsdom, React Testing Library, and `@testing-library/jest-dom`; `frontend/myfullstack/package.json` exposes `npm test`, `npm run lint`, and `npm run build`.
- **No additional test framework is recommended.** Use current runners and existing test conventions. MongoDB integration tests need a controlled test database or repository seams; never use production Atlas data.

## Test levels and principles

1. **Unit:** service guard/transition behavior with repository and email dependencies stubbed at existing module boundaries.
2. **Integration:** Express route → auth middleware → controller → service → repository using isolated test DB or deterministic fakes. Verify persisted state where a controlled DB is available.
3. **Security:** missing/invalid identities, forged body fields, owner mismatch, role downgrade/suspension, revoked or expired sessions, repeated tokens.
4. **Regression:** preserve existing route paths, status/payload shapes, public browsing, login/verification flow, post/event operations, admin operations, recovery messages.
5. **Concurrency/failure:** duplicate requests, reordered responses, DB/email failures, and retry behavior.

## Transition-to-test matrix

| Machine | Required unit tests | Required integration/security tests | Frontend regression tests |
|---|---|---|---|
| SM-01 Identity/access | complete/partial local auth hydration; mutually exclusive identity; login response validation; sign-out cleanup once | login success, invalid credentials, unverified/suspended user, missing token/session; 401 handling; guest/public reads | login/signup mode, guest/sign-in transitions, auth event synchronization, persisted reload |
| SM-02 Registration/verification | email normalization; required fields; duplicate; verification token one-use behavior | registration creates unverified user; email failure policy; valid/invalid verification; repeated and concurrent verification | registration success notice, verification message path, login after verification |
| SM-03 Session | active, missing, inactive, expired session guard; expiry equality boundary; logout target ownership | revoked token rejected immediately; logout one; logout all only self; unauthenticated logout denied; suspension and role changes take effect | local timeout message; activity resets timer; logout cleanup despite network error |
| SM-04 Recovery | email normalization/validation; token hash; expiry check; password validation; token consumption | generic response for known/unknown emails; rate limit; expired/used token rejected; password update stored hashed; email failure policy; optional session revocation only after approval | request loading/success/error; reset validation; error retry; success redirect |
| SM-05 Posts/moderation | author derived from principal; update allowlist; owner/admin guards; allowed moderation transitions | spoofed author rejected/ignored; non-owner update/delete denied; user cannot change moderation; admin review/remove; removed post excluded from public listing | create/list/delete; error/empty distinction; moderation dashboard behavior |
| SM-06 Events | author derivation; owner guard; required data | spoofed author; owner vs non-owner deletion; role gate; persistence unchanged for valid create | create/list/delete and errors |
| SM-07 Discovery | pagination replace/append; query/feed synchronization; stale-request suppression | public read and page bounds; feed switching while requests are in flight | projects/events toggle, list/grid, search scopes, load more, refresh, empty vs failed states |
| SM-08 Profile | drawer open/close; feed-specific form selection | backend owns identity; profile delete authorization per approved policy | drawer open/overlay close; create forms; logout confirmation and outcomes |
| SM-09 Admin | per-resource status, latest-search guard, mutation rollback | non-admin denied for every admin route; admin actions persist; DB role authoritative even with forged local storage/token role | route guard presentation, loading partial failure, search ordering, tab selection |
| SM-10 Async | status transition and error normalization for touched operations | DB/email failures do not produce success-shaped writes; retries do not duplicate irreversible side effects | loading, success, error, empty; navigation during pending request |

## High-priority acceptance tests

Before deploying any session/ownership change, all must pass:

1. A valid, unexpired active session reaches an authenticated route.
2. Revoking that session causes the same still-unexpired JWT to receive 401 on the next request.
3. Expired or inactive persisted sessions are rejected even if the record remains in MongoDB.
4. A user cannot revoke another user's session by changing email, session ID, or `logoutAll`.
5. An authenticated user cannot update/delete another user's post or event by forging `author` in the JSON body.
6. A user cannot change `author`, `reported`, `reportReason`, or `moderationStatus` through ordinary post update.
7. Reset tokens past expiry are rejected and do not change the password; valid tokens are single-use.
8. Existing authorized public reads, owner actions, admin moderation, login, signup/verification, and logout payload expectations remain covered.

## Environment and test-data safety

- Use generated fixtures and isolated test collections/database names.
- Do not connect test runs to production Atlas or read/write production users.
- Do not run destructive migrations or bulk updates as part of tests.
- If an integration DB is unavailable, report the skipped integration/security tests explicitly and retain unit/API tests; do not claim persistence behavior was validated.
- Reset email and auth secrets should be injected via test environment or mocks, never committed.

## Current verification baseline

No tests were run for this documentation-only planning phase. The preceding conversation reported prior frontend/backend test runs for unrelated UI work, but those are not treated as validation of the state-machine findings or future changes.
