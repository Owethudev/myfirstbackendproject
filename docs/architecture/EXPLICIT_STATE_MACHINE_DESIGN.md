# SNPL PORT Explicit State-Machine Design

## Design principles

- Make security-sensitive backend guards authoritative; UI state is presentation only.
- Preserve existing routes, response payloads, local-storage keys, and public browsing unless a behavior change is approved.
- Use discriminated unions/reducer-style transitions only where they prevent contradictory states; no new state-management library is proposed.
- Keep persisted domain state in MongoDB and transient UI/request state in React.
- Validate all transitions server-side and preserve Mongoose data compatibility.
- Treat product decisions listed in [STATE_TRANSITION_ANALYSIS.md](./STATE_TRANSITION_ANALYSIS.md) as approval gates.

## SM-01 — Client identity and access

**Purpose:** Present one mutually exclusive identity state and coordinate login, signup, guest mode, and sign-out.

**UI states:** `resolving`, `signedOut` (with `login` or `signup` form mode), `guest`, `authenticated`, and request substate `idle | submitting | error | notice`.

**Initial state:** resolve local user/token pair; authenticated only if both parse and meet the existing response contract; otherwise signed out. Keep current storage keys for compatibility.

| Current state | Event | Guard | Next state | Action / side effect |
|---|---|---|---|---|
| resolving | `AUTH_STATE_RESOLVED` | valid user + token | authenticated | hydrate user/token; clear guest |
| resolving | `AUTH_STATE_RESOLVED` | missing/invalid pair | signedOut | clear or quarantine inconsistent keys; retain existing session message behavior |
| signedOut/login | `LOGIN_SUBMITTED` | form valid | signedOut/login + submitting | POST existing login route |
| submitting | `LOGIN_SUCCEEDED` | user and token contract valid | authenticated | persist user/token/session ID atomically through existing manager; dispatch one auth event |
| submitting | `LOGIN_FAILED` | any error | signedOut/login + error | preserve message contract; do not create partial identity |
| signedOut/signup | `SIGNUP_SUBMITTED` | form valid | signedOut/signup + submitting | POST existing register route |
| submitting | `SIGNUP_SUCCEEDED` | response succeeds | signedOut/login + notice | show verification message; no authenticated state |
| signedOut | `GUEST_SELECTED` | none | guest | do not persist auth identity |
| guest | `SIGN_IN_SELECTED` | none | signedOut/login | clear guest |
| authenticated | `LOGOUT` or `SESSION_EXPIRED` | server/session result may fail; local cleanup still required | signedOut | clear client state once; preserve reason message |

**Invariants:** guest and authenticated are mutually exclusive; authenticated UI requires a complete user/token pair; frontend role is not authorization; backend still validates every protected request. Logout's server transition follows SM-03.

## SM-02 — Registration and verification

**Domain states:** `unregistered`, `pendingVerification`, `verified`, `suspended`, `deleted` (deleted only where the existing admin deletion flow is authorized). Login request outcome is separate from account state.

**Events:** `REGISTER`, `VERIFICATION_EMAIL_SENT`, `VERIFICATION_EMAIL_FAILED`, `VERIFY_TOKEN`, `SUSPEND`, `REACTIVATE`, `DELETE`.

| From | Event / guard | To | Required action |
|---|---|---|---|
| unregistered | register fields valid; normalized email unique | pendingVerification | persist user with `verified=false`; create/send verification token |
| pendingVerification | valid stored token | verified | set `verified=true`; clear token |
| pendingVerification | unknown/invalid token | pendingVerification | return existing invalid-token response; no write |
| pendingVerification | email delivery failure | **current behavior:** compensating deletion | Do not change until product/data-retention approval |
| verified | admin suspends | suspended | update user status, retain account data |
| suspended | admin reactivates | verified | clear suspended flag; preserve verification |
| verified or suspended | authorized delete | deleted | preserve current admin authorization; define session handling separately |

**Unresolved:** verification expiry, resend behavior, repeat verification idempotence, and failed-email retention. No expiry transition is designed until requirements are approved.

## SM-03 — Access session

**Persisted states:** `active`, `revoked`, `expired`; account availability is separately `verified/ unverified` and `suspended/active`.

**Events:** `LOGIN_ACCEPTED`, `AUTHENTICATED_REQUEST`, `LOGOUT_CURRENT`, `LOGOUT_ALL`, `TIME_EXPIRED`, `ACCOUNT_SUSPENDED`, `ACCOUNT_REACTIVATED`.

| Session state | Event / guard | Next state or result | Action |
|---|---|---|---|
| no session | login succeeds only for verified, unsuspended user | active | create `Session`; issue JWT with matching `jti` and expiry |
| active | request with valid JWT, active DB session, unexpired DB expiry, existing unsuspended user | active / allow | derive user role from database; attach user/session |
| active | invalid signature, invalid JWT expiry, missing/revoked/expired DB session | denied | return auth failure; do not call protected handler |
| active | authenticated current-session logout | revoked | verify target session is current principal's session; mark inactive |
| active | authenticated logout-all | revoked | verify principal; mark only that user's active sessions inactive |
| active | account suspended | denied | check current DB user state on each request |
| revoked/expired | any protected request | denied | no automatic reactivation |

**Guards/invariants:** never trust client email/session ID as authority; only session owner or explicitly authorized admin may revoke; persisted session must be active and future-expiring; JWT and persisted session identifiers/expiries must correspond. TTL cleanup is housekeeping, not authorization.

## SM-04 — Password recovery

**Request UI states:** `idle`, `submitting`, `success`, `error`. **Domain reset state:** `noToken`, `validToken`, `consumedOrExpired`.

| State | Event / guard | Next state | Action |
|---|---|---|---|
| idle | valid email submitted | submitting | existing rate-limited endpoint |
| submitting | API success | success | show generic existing message, clear email |
| submitting | network/API failure | error | show error, allow retry |
| noToken | known account reset requested | validToken | store hash and expiry; send email |
| validToken | token hash matches and expiry is future; password passes backend validation | consumedOrExpired | hash/save password; clear reset token fields |
| validToken | missing, mismatched, expired token or invalid password | validToken/error | reject without changing password |

**Session side effect:** proposed session revocation after success is a policy decision requiring approval. It is not assumed in this design.

## SM-05 — Project/post lifecycle

**Current persisted statuses:** `pending`, `approved`, `removed`; reported flag is an independent moderation signal. Current model defaults to `approved`.

**Events:** `CREATE`, `REPORT` (if/when a route exists), `REVIEW`, `UPDATE`, `OWNER_DELETE`, `ADMIN_REMOVE`.

| From | Event / guard | To | Notes |
|---|---|---|---|
| absent | create by authenticated user | approved (current default) | author/owner must come from authenticated principal; do not change default without approval |
| approved/pending | review by admin | approved/pending/removed as allowed by approved transition policy | explicit allowlist and audit behavior required |
| any existing status | update by owner or admin | same status | allowlist editable content fields; do not accept role/moderation/owner from ordinary user |
| any existing status | delete by owner or admin if product permits | deleted | current owner delete is physical; preserve unless retention policy authorizes change |
| approved/pending | admin remove | removed | current admin-delete is soft removal and public query excludes removed |

**Ownership:** current documents store author username, not immutable owner ID. Plan must select a compatibility strategy and must not silently rewrite/backfill production documents.

## SM-06 — Event lifecycle

**States:** `absent`, `published`, `deleted` (current delete is physical). **Events:** `CREATE`, `LIST`, `OWNER_DELETE`.

| From | Event / guard | To | Action |
|---|---|---|---|
| absent | authenticated create; required fields valid | published | author derived from principal; preserve current fields |
| published | public list | published | paginated read |
| published | owner-authorized delete | deleted | preserve existing physical deletion unless approved otherwise |

No edit, moderation, RSVP, or visibility transition is in scope because none is evidenced in current routes/models.

## SM-07 — Community discovery UI

Represent as an orthogonal product state rather than every cross-product:

- `identity`: supplied by SM-01.
- `feed`: `projects | events`.
- `layout`: `list | grid`.
- `query`: term plus matching feed scope.
- Each dataset: `idle | loading | loaded | empty | error`, page, `hasNext`.
- `refresh`: `idle | refreshing`.

**Events:** `SELECT_FEED`, `SET_LAYOUT`, `SET_QUERY`, `LOAD_FIRST_PAGE`, `LOAD_NEXT_PAGE`, `LOAD_SUCCEEDED`, `LOAD_FAILED`, `REFRESH`.

**Invariants:** selected search scope matches selected feed; load-more operates only on the relevant dataset; stale response cannot overwrite a newer query; failures are not represented as successful empty data; guest/public read access remains unchanged.

## SM-08 — Profile drawer and account actions

**States:** `closed | open`; form context `project | event`; each submission `idle | submitting | success | error`. Logout/account delete delegate to SM-01/SM-03/SM-02.

**Invariants:** authenticated user identity comes from current server-authenticated principal; only render user's actions as affordances, but server enforces ownership; delete-profile policy must be resolved before UI/backend changes.

## SM-09 — Admin operations

**States:** role guard `checking | allowed | denied`; each resource independently `idle | loading | loaded | error`; selected tab `overview | users | reports | audit`; each mutation `idle | pending | succeeded | failed`.

**Events:** route entry, resource response, tab selection, search change, suspend/reactivate, role update, user delete, post review/remove, audit query.

**Invariants:** all admin transitions require backend-verified current role; presentation guard is not a security control; stale search responses do not replace newer results; only commit local optimistic state after validated response or roll back on failure.

## SM-10 — Async operations

Use local status for each independent request/action (`idle | pending | succeeded | failed`) and domain result (`data`, `empty`). Avoid one global `loading`/`error` when requests are concurrent. Keep existing API response contracts and error messages unless a separately approved change is needed.

## Rollout and compatibility

1. Add tests representing current successful workflows and failing security transitions.
2. Fix guards without changing API response payloads where possible.
3. For identity ownership, preserve all existing content; decide legacy string-author handling before enforcement.
4. Do not add/alter database fields without explicit migration/backfill plan and approval.
5. Deploy the server-side guard before any UI simplification; frontend must never be the sole control.
