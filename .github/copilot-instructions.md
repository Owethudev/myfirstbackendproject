
# SNPL PORT — Engineering Instructions

## 1. Project identity

SNPL PORT is a full-stack portfolio and social platform.

Frontend:
- Vite
- React
- TypeScript
- Tailwind CSS

Backend:
- Node.js
- Express
- MongoDB Atlas

The application allows users to register, authenticate,
publish portfolios, discover other users' work and interact
with the community.

## 2. Core engineering principles

- Follow SOLID principles.
- Prioritize security, maintainability and performance.
- Preserve existing functionality.
- Never remove existing features without explicit authorization.
- Never introduce unrelated features.
- Avoid unnecessary dependencies.
- Avoid duplicate code and dead code.
- Prefer small, focused changes.

## 3. Backend architecture

Respect the existing architecture and conventions.

Where applicable, follow:

Model
  -> Repository
  -> Service
  -> Controller
  -> Route

Middleware should handle authentication, authorization,
validation and other cross-cutting concerns.

Controllers must remain thin.

Business logic belongs in services.

Database access belongs in repositories.

Never bypass authentication or authorization checks.

## 4. Security requirements

- Never expose environment variables or secrets.
- Never hardcode credentials.
- Validate and sanitize incoming input.
- Enforce authorization on the server.
- Never trust frontend role checks.
- Use secure password handling.
- Avoid leaking sensitive information in errors.
- Protect against common web vulnerabilities.
- Follow least-privilege access principles.

## 5. Frontend requirements

- Reuse existing components and hooks.
- Keep components focused and maintainable.
- Handle loading, error and empty states.
- Preserve responsive layouts.
- Keep API communication consistent with existing patterns.
- Never expose private backend logic in the frontend.

## 6. Database requirements

- Inspect existing MongoDB models before making changes.
- Preserve existing data compatibility.
- Avoid destructive schema changes.
- Never delete production data.
- Include migration or compatibility considerations
  when changing data structures.

## 7. Git workflow

- Never commit directly to main.
- Create a separate feature or fix branch per task.
- Use descriptive branch names.
- Write meaningful conventional commits.
- Push changes to the assigned feature branch.
- Create a pull request against main.
- Never merge your own PR.
- Never force-push shared branches.

## 8. Testing requirements

- Inspect existing test infrastructure first.
- Add tests for new functionality.
- Update tests when existing behavior changes.
- Run relevant backend tests.
- Run relevant frontend tests.
- Run linting where configured.
- Run the frontend production build.
- Never claim tests passed if they were not executed.
- Report skipped tests and explain why.

## 9. Change management

Before modifying code:
1. Understand the existing implementation.
2. Identify affected files and dependencies.
3. Prepare a short implementation plan.
4. Identify possible regressions.

After modifying code:
1. Review the complete diff.
2. Check for security regressions.
3. Run relevant validations.
4. Document important decisions.
5. Report remaining risks.

## 10. Definition of done

A task is complete only when:
- The requested functionality is implemented.
- Existing functionality is preserved.
- Relevant tests pass.
- Production build passes where applicable.
- No known critical security issues are introduced.
- Changes are committed to a feature branch.
- A pull request is created.
- Validation results and limitations are documented.

If requirements are ambiguous or a destructive
operation is necessary, stop and request clarification.
