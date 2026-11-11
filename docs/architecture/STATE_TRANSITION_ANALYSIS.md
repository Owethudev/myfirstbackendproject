# SNPL PORT State Transition Analysis

## Purpose and evidence limits

This document records current behavior evidenced in source, distinguishes it from likely intent, and proposes conservative target behavior. It is a static source review, not a penetration test or a production database inspection. No application code or database data was changed.

Priority labels here describe implementation risk: **P0** blocks trustworthy session/auth behavior, **P1** is important security or data-integrity work, and **P2** is reliability/UX or lower-impact consistency.

## SM-01 — Client identity and access

| Current behavior | Analysis / invalid or missing transitions | Recommended behavior |
|---|---|---|
| `useAuth` initializes user and token separately from local storage. `AppShell` separately tracks `isGuest`. Auth view is selected by `!user && !isGuest`. | **Contradictory/partial state:** user without token and token without user are representable. `isAuthenticated()` requires both, while the component chooses signed-in UI from `user` alone. Existing valid storage shapes must be checked before tightening this behavior. | Model a derived identity state (`signedOut`, `guest`, `authenticated`) from a validated user/token pair. Preserve the existing storage keys and event for compatibility; define a recoverable invalid-storage transition to signed out. |
| Login stores response values directly in local storage and emits `auth:state-changed`; signup returns to login with a verification message. | A login response with user but no token can leave a partial login UI. Error transitions leave typed fields populated; behavior may be intentional but is undocumented. | Treat login as successful only after response contract and required auth fields validate. Retain the current signup/verification workflow and message contract. Confirm UX expectations for clearing login fields. |
| Guest mode is an independent boolean. Header sign-in sets guest false; guest action sets it true. | User and guest simultaneously true is representable though the normal handlers avoid it. | Make the identity state mutually exclusive and test sign-in/guest/auth transitions. |
| `signOut` clears storage, sets message and may hard-navigate to `/`. | Session timeout calls `handleSessionExpired` and then the supplied callback invokes `signOut`, causing duplicate clear/event side effects. | One owner should perform expiry cleanup and notification once. Keep current expiry message and route behavior. |

## SM-02 — Registration and verification

| Current behavior | Analysis / invalid or missing transitions | Recommended behavior |
|---|---|---|
| Register validates required fields, normalizes email, checks duplicate email, creates an unverified user, then awaits verification email. On email failure it deletes the new user. | Email failure is handled by a destructive compensating action. Concurrent or repeated registration can make rollback semantics surprising; exact safe behavior depends on product/data policy. | Do not change rollback or retain-pending-account semantics without product approval. Add tests for duplicate request and email failure before changing the transaction behavior. |
| Verification matches `verificationToken`, sets `verified=true`, clears token, redirects. | No expiry field/check exists in inspected schema/service. Invalid token returns 400. Repeated verification after success is invalid rather than idempotent. | Confirm required link lifetime and repeated-click behavior. If expiry is required, add backward-compatible field/logic and migration/default behavior only after approval. |
| Login rejects unverified and suspended users. | A verification email resend path was not found. | Do not invent resend semantics; list as product decision if required. |

## SM-03 — Access-session lifecycle

| Current behavior | Analysis / invalid or missing transitions | Recommended behavior |
|---|---|---|
| Login creates active session with expiry derived from JWT expiry; JWT carries session ID in `jti`. Middleware verifies JWT, looks up session by ID, fetches user, rejects suspended user, and sets role from database. | Strong design elements: protected route role is sourced from DB, and account suspension is checked on authenticated requests. | Preserve session ID in the JWT and DB role refresh; use these as invariants. |
| `getActiveSession(sessionId)` delegates to repository `findOne({sessionId})`. It does not filter `active` or `expiresAt`. Logout updates `active=false`; TTL later removes expired documents. | **P0:** a still-valid JWT can pass after its session was revoked, because middleware only checks that a session document exists. TTL deletion is not immediate revocation. A session with a stale/expired persisted expiry can also be found while JWT remains valid if the values diverge. | Enforce `active === true` and `expiresAt > now` in the authoritative lookup/guard; fail closed if no eligible session. Add direct unit/integration tests for revoked and expired persisted sessions. This should preserve successful active sessions. |
| Logout service accepts email, a session ID, and `logoutAll`; it revokes all when `logoutAll` is true **or when session ID is absent**, and otherwise revokes the supplied ID. Route has no `authorize` middleware; global session middleware permits requests without a token. | **P1:** anyone knowing an email can call logout without a session ID (or request logout-all) and revoke that account’s active sessions. When one session ID is supplied, ownership of that session is not checked against the email or authenticated principal. This is an availability / cross-session isolation issue. | Bind logout to authenticated `req.user` and `req.session`, validate logout-all authorization, and reject unauthenticated requests. Confirm intended compatibility for the current email/sessionId body contract before changing clients. |
| Inactivity timeout is 20 minutes based on mouse, keyboard, scroll, touch, click. | Timer reset updates on activity. Session expiration callback duplicates cleanup. The browser timeout is only UI behavior; server token/DB guards must remain authoritative. | Keep client inactivity UX but consolidate cleanup. Test the server-side expiry independently of frontend timers. |
| JWT expiry parser silently falls back to 30 minutes for unsupported values; production requires `JWT_SECRET`. In non-production missing secret generates a process-random value. | Invalid configuration can silently differ from operator expectation; development tokens stop working across restarts. | Consider explicit validation at startup and document the dev-only behavior. Do not change deployment configuration without checking Render env values. |

## SM-04 — Password recovery

| Current behavior | Analysis / invalid or missing transitions | Recommended behavior |
|---|---|---|
| Forgot-password normalizes/validates email, sets SHA-256 token plus a 15-minute expiry for an existing user, awaits email, then returns a generic success for existing and unknown emails. Rate limiter is 3/hour. | Good anti-enumeration response shape. On email failure, token remains stored and the service returns 500; no retry/cleanup state is represented. | Preserve generic response and limiter. Decide whether failed delivery should clear/replace the token or allow retry before altering semantics. |
| Reset query matches `resetPasswordToken` only. The schema stores `resetPasswordExpires`; `findUserByResetToken()` does not compare expiry with current time. | **P1:** expiry is written but not enforced in the lookup path; a token can remain usable past its intended 15-minute lifetime until cleared or replaced. | Query/guard both token match and future expiry, clear expired token only through a safe, tested path. Preserve the single-use token behavior. |
| Reset changes password and clears reset fields, but does not revoke active sessions. | Existing access sessions remain usable until JWT/session expiry. Whether password reset should sign out all devices is a product/security policy decision. | Recommend revoking all sessions after password reset, but mark it as a behavior change requiring approval; optionally provide explicit “stay signed in” policy only if product requires it. |
| Client checks token existence, six-character password minimum, and confirmation. | Frontend and backend minimum match. Recovery route errors are local UI state; no request cancellation is apparent if navigation occurs mid-submit. | Keep backend validation authoritative. Add tests for missing/expired/used token, password mismatch and backend failure. |

## SM-05 — Project/post lifecycle and moderation

| Current behavior | Analysis / invalid or missing transitions | Recommended behavior |
|---|---|---|
| Create route requires user/admin role, but service accepts `author` from request body. | Authenticated user can submit another creator name; ownership is a client-controlled string rather than a trusted identity. | Use `req.user` identity server-side. Existing author strings and records make a user-ID migration a separate, compatibility-sensitive choice. |
| Update route allows user/admin; controller forwards only ID and body; service updates with the whole body and has no owner check. | **P1:** any authenticated user can update another post by ID and may update author/moderation fields allowed by the model. | Enforce owner-or-admin policy using authenticated principal and field allowlist. Preserve admin intent only where specified. Test both authorized and denied updates. |
| Delete route requires user/admin role; service authorizes by comparing body username with stored author. | Username can be forged. A user can delete another post by supplying its author name. | Bind ownership to authenticated principal, not the request body. Existing records lack immutable owner IDs, so define a compatibility strategy (legacy name match vs migration) before enforcement. |
| Admin review route is admin-only; `reviewPost` sets reported/reason/status based on payload; admin-delete soft-removes. | Review status transition constraints are not explicit; schema enum constrains persisted moderation values. | Define an allowed transition table and audit event behavior. Keep public visibility behavior and admin review capabilities. |
| Public query excludes `moderationStatus: removed`; the model defaults to approved. | Unknown/incomplete status semantics for `pending`; no create-to-pending transition is evidenced. | Do not change status policy without product confirmation. |

## SM-06 — Event lifecycle

| Current behavior | Analysis / invalid or missing transitions | Recommended behavior |
|---|---|---|
| Create requires user/admin role but accepts body `author`; delete compares a body username with string `author`. | Author spoofing on creation and forged ownership on deletion mirror post issues. | Derive owner from authenticated principal and enforce server-side ownership. No moderation lifecycle is evidenced. |
| No event update/moderation route is present in inspected routes. | Editing and moderation transitions are absent; do not infer them from post behavior. | Preserve current create/list/delete feature set. |

## SM-07 — Community discovery

| Current behavior | Analysis / missing or contradictory states | Recommended behavior |
|---|---|---|
| Initial project/event data loads on mount and user ID change; refresh loads both concurrently. | Guest and signed-out states also trigger public feed loads; this appears intentional. Error logs and empties the feed, so “empty” and “load failed” look identical. | Preserve public browsing. Represent loading/error/empty distinctly without changing API contracts. |
| `activeFeed` and `searchScope` are distinct. Header scope change updates both; bottom nav updates only active feed. Search filters only the selected in-memory dataset. | Switching feed from nav can leave search scope label stale; page switching does not reset or scope search state consistently by one source of truth. | Derive search scope from selected feed or synchronize both in one transition. Add regression tests for switching via either control. |
| Pagination has separate page and `hasMore` state for each feed; load-more handler toggles one shared `loadingMore`. | Cross-feed in-flight load can retain/append data after switching. `loadingMore` resets only after `await`; a thrown error outside internal catches could leave it true. | Keep separate pagination state and guard against stale responses. Test append vs replace, duplicate requests, and switching feeds mid-request. |
| Pull-to-refresh triggers at distance >90 and clears spinner on fixed 700ms timer rather than data completion. | Refresh can visually finish before network request; outstanding timer is not cancelled on unmount. | Tie refresh lifecycle to actual requests; maintain the pull gesture threshold and visual affordance. |

## SM-08 — Profile drawer/account actions

| Current behavior | Analysis / missing transitions | Recommended behavior |
|---|---|---|
| Drawer is open/closed boolean. Form shown depends on active feed. | No explicit close-on-route transition; parent owns selected feed and form data. | Keep form data when switching feeds unless product expects reset; add tests before changing. |
| Logout calls backend service, which clears local auth state in `finally`; parent resets UI. | Remote failure still yields local sign-out. Backend endpoint may have already failed; P1 logout authorization finding is covered under SM-03. | Keep local sign-out safety behavior while enforcing server authorization and recording remote failure. |
| Profile delete asks confirmation and sends email to `/api/v1/users/delete`; route is admin-only. | **P1 behavior mismatch:** normal user UI exposes delete but backend route authorizes only admins. This may be intentional (admin-only deletion) or a broken self-delete flow. | Product owner must confirm desired self-delete behavior. Do not loosen admin-only backend authorization based on UI alone. |
| Profile data/action errors share message state with other UI. | Error may persist across tabs/operations without explicit event correlation. | Consider action-specific feedback only if it can be introduced without changing current messages. |

## SM-09 — Admin dashboard

| Current behavior | Analysis / missing transitions | Recommended behavior |
|---|---|---|
| Route guard checks local stored role, then dashboard repeats role and token check. API routes use `authorize("admin")`. | Client role is only a navigation convenience; backend is the security boundary. Do not rely on or extend client-only checks. | Preserve API-level authorization; optionally simplify duplicate presentation guards after tests. |
| Stats, users, and reported posts load concurrently; `loading=false` is set in reports request `finally`. Each loader writes to one shared error string. | Dashboard can appear loaded while stats/users are still pending. One failure may be overwritten by another success or vice versa. | Track per-resource status or await all outcomes before declaring ready, without hiding partial data. |
| Search debounce runs a request per change after timeout; prior fetches are not cancelled. | Out-of-order responses can replace newer search results. | Add abort/request sequence guard; test rapid search ordering. |
| Client lists are optimistically updated after admin operations. | No refresh or rollback on partially successful response beyond catch. | Validate response before local commit; test failed/malformed responses. |

## SM-10 — Async operations and external services

| Current behavior | Analysis / missing transitions | Recommended behavior |
|---|---|---|
| Async operations use combinations of loading booleans, data, and error/message strings. | Several booleans can express impossible combinations; errors differ by module and often have no retry state. | Prefer narrow per-operation status unions where it removes real ambiguity; do not introduce a global state library. |
| Email sends are synchronous service calls. Registration deletes user on delivery failure; password-reset token remains after delivery failure. | Partial success and retry semantics differ between account flows. | Add tests first; agree on data-retention and retry policy before changing compensating behavior. |
| DB lookup errors within session middleware are caught and returned as 401. | Infrastructure outage is indistinguishable from invalid credentials/session; observability may be poor. | Preserve fail-closed behavior while logging/classifying infrastructure failures separately and returning a non-auth failure where safe. |

## Explicitly unresolved product decisions

1. Should reset-password success invalidate every access session?
2. Should verification links expire; if so, what duration and behavior for existing accounts?
3. Should repeated verification be idempotent/successful or remain a 400?
4. Is account deletion intended to be self-service, admin-only, or both? Current UI/backend disagree.
5. Are project/event authors intended to be immutable user identities? Current stored author field is a username string.
6. Should post creation default to approved, or should new posts require moderation? Current schema defaults to approved.
7. Should login failure response distinguish nonexistent user from wrong password? Current service does distinguish them; changing that alters API behavior and enumeration risk.
8. For registration email failure, should the account be deleted (current behavior) or retained for resend? This affects persistence and recovery semantics.
9. Are email provider retries/background delivery required? No job system is evidenced.

These are not implementation assumptions. The roadmap identifies where approval is required.
