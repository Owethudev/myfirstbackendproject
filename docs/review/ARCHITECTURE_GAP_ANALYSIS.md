# Architecture Gap Analysis

## Scope

Compared the proposed state-machine model with the checked-out React/Vite and Express/Mongoose implementation. The frontend/backend source paths are unchanged relative to `origin/main`. This is a static architecture review, not a runtime trace of production.

## Current architecture

### Frontend

- React with TypeScript, Vite, React Router, Tailwind, and local component/hook state; no global state library or explicit state-machine package.
- `App.tsx` is an approximately 748-line application shell with independent auth, feed, pagination, search, form, drawer, refresh, and feedback state. `AdminDashboard.tsx` is approximately 582 lines and owns resource loading, search, user mutations, post moderation, and audit display.
- API communication is split across `authService`, `apiClient`, and direct `fetch` calls. `apiClient` delegates to `authService`, but direct calls in `App.tsx` bypass that wrapper. This creates inconsistent token/header/error handling and should be consolidated only incrementally with contract tests.
- Many unrelated asynchronous requests share booleans and one message/error value. Feed failures can clear data and resemble an empty feed; admin resource loading can appear complete before all concurrent requests finish. Admin search requests can return out of order.
- Auth identity is represented by multiple local-storage values and React flags, rather than one atomic persisted identity state. Existing synchronization events and guest browsing are functional behaviors to preserve.

### Backend

- Routes apply middleware and call thin controllers; controllers call services; services use repositories and Mongoose models. This is a recognizable Model -> Repository -> Service -> Controller -> Route architecture. Not every operation follows all layers (for example, authentication middleware accesses `User` directly), but a new abstraction layer is not warranted solely for uniformity.
- Server startup connects to MongoDB before listening (`backend/src/index.js`). The app module itself is exported separately for tests.
- `sessionMiddleware` permits requests without credentials to continue as guests; protected routes rely on `authorize`. The middleware loads the current user/role, but its session repository lookup does not enforce active/expiry status and its broad catch maps infrastructure failures to 401.
- Authorization is inconsistent at service boundaries. The profile update and post/event controllers forward client bodies without an authenticated principal; corresponding services trust client-selected IDs or usernames. Route-level role checks do not replace object-level ownership checks.
- Validation is mostly inline in services, with pagination clamping and model constraints in selected areas. No consistent request-schema validation layer is evident. `findByIdAndUpdate` does not enable `runValidators`; passing the full post body also permits unintended fields unless the model strips them.
- Expected service results are normalized by `controllerResponse` helpers; controllers also catch and convert unexpected errors. The app has a final error handler. Session middleware's error classification and some email failures remain inconsistent. Do not replace these patterns with a global abstraction without tests.
- Database access is generally isolated in repositories. No verified circular dependency was identified in the reviewed request path; this was not a repository-wide static cycle analysis.
- Email verification and reset delivery are synchronous calls. Registration deletes the just-created user if email delivery fails; reset delivery failure returns an error after its token has already been saved. There is no queue or retry state. Avoid adding queue infrastructure absent a scale/reliability requirement and approved operational plan.

## Gap register

| Gap | Evidence | Risk / recommended response |
|---|---|---|
| Object-level account authorization | `/users/update` accepts body ID; service loads/updates that account without binding to `req.user`. | High account-integrity risk. Derive or validate target identity server-side; explicitly preserve any approved admin behavior. |
| Session revocation/expiry enforcement | Session lookup filters only by session ID. | Logout and revocation do not reliably invalidate an unexpired token. Enforce active/future expiry and test with a controlled persistence layer. |
| Logout identity and authority | Logout has no route authorization and uses body email/session ID/logout-all. | Bind revocation to authenticated principal and session; maintain local sign-out when remote call fails. |
| Content ownership and update allowlist | Post update accepts arbitrary body; post/event deletion compares body username; creation accepts body author. | Prevent cross-owner changes and protected-field mutation using server-derived principal and explicit fields. Preserve legacy username-only documents. |
| Inconsistent client request layer | `apiClient` wraps `authService`, while `App.tsx` also uses direct `fetch`. | Headers, error handling, and auth cleanup can diverge. Migrate touched calls only, retaining the current request/response contract. |
| Oversized UI coordinators | `App.tsx` ~748 lines; `AdminDashboard.tsx` ~582 lines. | Higher cognitive load and shared state coupling. Extract only cohesive, independently testable responsibilities when a scoped change touches them; do not rewrite the UI as an audit side effect. |
| Request status conflation | Shared loading/error state and clearing data on feed errors. | Users may see empty or stale results instead of partial failure. Introduce per-resource state only where needed and preserve current UI affordances. |
| Validation gaps | Service-level checks vary; update repository omits `runValidators`. | Invalid or privileged fields can reach persistence. Validate allowlisted inputs and test persistence behavior before changing contracts. |
| Auth/error classification | Session middleware catches JWT and database failures together. | Infrastructure outage resembles user sign-out and impairs observability. Preserve fail-closed access while distinguishing expected invalid credentials from dependency errors. |
| Audit URL secrets | Audit log stores original URL; verification token is in a path segment. | Secret retention in audit records. Redact token-bearing path segments before persistence and test logs without weakening audit coverage. |
| Fake/unsupported feature expectation | No comment/interaction routes or models; `totalComments` is a constant. | Do not create a feature or infer business semantics from a placeholder statistic. |

## SOLID and complexity assessment

The backend's existing service/repository split is a reasonable foundation and controllers are mostly thin. The main SOLID concern is that services are not consistently given the authenticated principal, which makes the security boundary implicit and client-controlled. Correct that at the route/controller/service boundary rather than adding a broad policy framework.

The UI has oversized coordinators and duplicated API access paths, but splitting every state variable into reducers or introducing a global store would add complexity without demonstrated need. Prefer focused state/status handling in the component and workflow being changed. No database or event-bus abstraction is missing for the currently evidenced feature set.

## Architectural decisions for any approved work

1. Keep route guards and enforce object ownership in backend services using authenticated identity.
2. Keep repositories responsible for persistence and avoid controllers with business rules.
3. Keep existing API paths and response shapes unless separately approved and compatibility-tested.
4. Do not introduce comments, notifications, a queue, a state library, or a state-machine dependency based only on the proposed diagrams.
5. Test independent asynchronous resource states and ordering before extracting shared UI state.
