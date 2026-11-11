# Registration and Verification Expiry — Implementation Report

## Status

Implemented on `feature/verification-token-expiry`, based on `origin/main` at `f330b12` (PR #43 merge). This is a focused implementation of Priority 4's verification-expiry transition; it does not add resend or alter email-delivery failure handling.

Policy defaults used for this implementation:

- Newly issued verification tokens expire after 24 hours.
- Pending legacy accounts whose stored token has no expiry remain verifiable for compatibility.
- Verification remains atomic and single-use.
- No resend flow is added.
- The existing behavior that deletes the newly created account if email delivery fails is unchanged.

## State machine completed

- **Registration succeeds:** an unverified account receives the existing verification token plus a 24-hour expiry timestamp; the existing email URL and API response remain unchanged.
- **Token has a future expiry:** atomic token consumption marks the account verified and removes the token and expiry.
- **Token is expired or at the expiry boundary:** it cannot be consumed and the existing `400 Invalid or expired verification token` response remains.
- **Legacy pending token with null/missing expiry:** remains eligible, preserving already-issued links and existing pending accounts. Such legacy tokens do not gain a newly enforced expiry.
- **Repeated/concurrent verification:** the prior atomic, single-use behavior remains unchanged.
- **Email delivery fails:** current account-deletion behavior is preserved. No retry or resend behavior was introduced.

## Files changed

- `backend/src/models/user.model.js` — adds nullable `verificationTokenExpires` date field; no data migration is required.
- `backend/src/repositories/user.repository.js` — atomically requires either a future expiry or a null/missing legacy expiry, and clears both token fields on success. User-list projection excludes the new field.
- `backend/src/repositories/user.verification.repository.test.js` — covers query rules, expired/boundary rejection, legacy compatibility, atomic single use, and token/expiry clearing.
- `backend/src/services/user.service.js` — assigns a 24-hour expiry to newly generated verification tokens.
- `backend/src/services/user.service.test.js` — verifies the expiry duration.

## Previous and new behavior

Previously all matching unverified tokens remained usable indefinitely. Newly issued tokens now expire after 24 hours. Old pending accounts without an expiry remain verifiable to avoid invalidating existing links; expired legacy records cannot be distinguished from older non-expiring records and therefore also remain eligible under this compatibility rule.

## Tests and validation

### Baseline before implementation

- Backend `npm test`: passed, 30 tests.
- Frontend `npm test`: passed, 17 tests.
- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed; TypeScript check succeeded. Existing 539 kB `OrbitalScene` chunk-size warning was emitted.

### After implementation

- Targeted `node --test src/repositories/user.verification.repository.test.js src/services/user.service.test.js`: passed, 10 tests.
- Backend `npm test`: passed, 33 tests, 0 failures.
- Frontend `npm test`: passed, 17 tests, 0 failures.
- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed; TypeScript check succeeded. Existing `OrbitalScene` chunk-size warning remains.
- `git diff --check`: passed.

Repository tests mock the atomic MongoDB update; no MongoDB-backed registration, email delivery, or verification HTTP workflow was run. No production data was accessed or changed.

## Compatibility, security, and remaining risks

- Verification route, token format, success redirect, and invalid-token response are unchanged.
- Adding a nullable field is backward compatible; no schema migration or existing-record rewrite was performed.
- Legacy accounts without an expiry remain verifiable indefinitely. This deliberately favors compatibility but means a previously issued legacy token is not time-limited.
- Email-send failure continues to delete the newly created account. This policy was preserved rather than silently changed.
- No resend endpoint, throttling, or retry behavior was added.
- No environment, deployment, or database operation was performed.

## Suggested commit message

`fix(auth): expire new verification tokens after 24 hours`

## Recommended next step

Review the 24-hour policy and compatibility treatment. If legacy tokens should also expire or failed-email accounts should be retained, define a separate approved transition/migration policy before changing those behaviors.
