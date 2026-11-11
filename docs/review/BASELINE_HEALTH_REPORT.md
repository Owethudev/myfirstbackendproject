# Baseline Health Report

## Baseline scope and Git state

The checks below ran in the existing worktree on branch `update`, HEAD `63df531`, tracking `origin/update`. `origin/main` is 39 commits ahead and HEAD is an ancestor of it (`git rev-list --left-right --count origin/main...HEAD` returned `39 0`). `git diff HEAD origin/main -- backend/src frontend/myfullstack/src` showed no differences, so the reviewed application source matches mainline; the current branch itself is not an isolated feature branch.

Before creating this report, `git status --short` showed only `?? docs/`, containing the prior untracked audit documents. No tracked changes were observed. This validation adds only `docs/review/` documents. No checkout, reset, commit, push, merge, or overwrite was performed.

The current HEAD subject is `.`. The recent history includes `b49ee1a security tightening` and `2b286cd feat(frontend): revamp UI with 3D visuals and transitions`; the latest relevant change cannot be inferred solely from those subjects. Reconfirm exact history before future implementation.

## Frontend baseline

| Check | Command | Result |
|---|---|---|
| Dependency availability | Invoked existing npm scripts; no install/restore performed. | Installed dependencies were available to run the scripts. |
| Automated tests | `npm test` from `frontend/myfullstack` | Passed: 1 test file, 6 tests. Tests cover auth view, guest feed rendering/actions, and grid presentation; they are not end-to-end account workflows. |
| Lint | `npm run lint` from `frontend/myfullstack` | Passed: `eslint .`. |
| TypeScript and production build | `npm run build` from `frontend/myfullstack` | Passed: `tsc -b` and Vite production build. Vite emitted a chunk-size warning for the 539.02 kB `OrbitalScene` chunk; build still succeeded. |

## Backend baseline

| Check | Command | Result |
|---|---|---|
| Package test script | `npm test` from `backend` | Passed: 2 tests (app export and malformed JSON response). |
| Full Node test discovery | `node --test` from `backend` | Passed: 3 tests, including expired JWT response behavior. |
| Lint | `npm run lint` from `backend` | Not configured; backend `package.json` exposes `start`, `dev`, and `test`, but no lint script. |
| Startup | `npm start` was not run. | Not tested. `backend/src/index.js` connects to MongoDB before listening. The repository has a root `.env`, but its values were not inspected and no isolated non-production database was confirmed. Starting the service could contact a configured database, so it was intentionally avoided. |
| API validation | No deployed or locally started API was exercised. | The Express app unit tests are limited; they do not validate login, session persistence, registration, recovery, authorization, or database workflows. |
| Database connection | Source inspected only. | `backend/src/config/database.js` reads `MONGODB_URI`; no live connection attempt was made. Atlas health, URI validity, deployment secrets, and production data were not inspected. |

## Workflow verification matrix

Source presence and UI rendering are not treated as proof that a workflow works. No safe test database, email provider, or test-account configuration was confirmed, so no database-backed or external-service workflow was exercised.

| Workflow | Status | Evidence / limitation |
|---|---|---|
| Registration | Not tested | Requires database persistence and verification email delivery. |
| Login and logout | Not tested end-to-end | Unit coverage includes expired JWT response only; no persisted session or token round trip was tested. |
| Email verification | Not tested | Requires a registered test user and email/token flow. |
| Password recovery | Not tested | Requires isolated user persistence and a safe email/token flow. |
| Session management | Not tested end-to-end | Expired-token middleware test passes; active/revoked/expired database session behavior was not exercised. |
| Portfolio creation | Not tested | No API/database integration test or test account. |
| Portfolio editing | Not tested | No API/database integration test; object-level authorization requires coverage. |
| Portfolio deletion | Not tested | Frontend tests only assert that guests do not see delete controls; server persistence/ownership was not exercised. |
| Comments and interactions | Not applicable / not evidenced | No comment model/routes or interaction lifecycle found. The admin `totalComments` value is a constant, not a working feature. |
| Administrative access | Not tested end-to-end | No admin fixture/session or protected API test was run. |
| User management | Not tested | Requires database-backed admin and user accounts. |
| Notifications | Not tested / not evidenced as a subsystem | Email sends exist, but no notification queue/status/retry workflow is implemented. |

## Deployment and configuration observations

- `netlify.toml` configures the frontend build and SPA fallback. No Render deployment manifest/configuration was found in the repository; backend URLs appear in source defaults. This does not establish current deployed configuration.
- Frontend API base URL is supplied by `VITE_API_BASE_URL`; backend database connection reads `MONGODB_URI`. Actual values, production deployments, CORS allowlists, and provider credentials were not inspected or tested.
- Production deployment health and Netlify/Render/Atlas integration remain unverified.

## Baseline conclusion

Local frontend tests, lint, and production build pass; backend unit tests pass. These results establish a useful code baseline, not application workflow health. Database-backed, email-backed, authorization, and deployed workflows remain untested. The build warning and behind-main branch state should be included in any later implementation checkpoint.
