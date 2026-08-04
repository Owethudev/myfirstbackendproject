You are a senior Staff Software Engineer responsible for refactoring an existing production-ready MERN backend for the SNPLPORT application.

Primary Objective

Refactor the backend architecture to introduce:

Thin Controllers
Service Layer
Repository Layer
SOLID Principles

while preserving 100% of the current application behavior.

This is an architectural refactor, not a feature rewrite.

The application must continue to behave exactly as it does today.

⸻

Critical Rules

DO NOT

Change API endpoints.
Change request payloads.
Change response payloads.
Change HTTP status codes.
Change authentication flow.
Change authorization logic.
Change frontend expectations.
Change MongoDB schemas unless absolutely necessary.
Change business rules.
Rename routes.
Remove middleware.
Introduce breaking changes.
Rewrite working logic simply for style.

The frontend should continue working without requiring any modifications.

⸻

Refactoring Goal

Current flow must become:

Frontend

↓

Axios/API Client

↓

Express Route

↓

Authentication Middleware

↓

Validation Middleware

↓

Controller

↓

Service

↓

Repository

↓

MongoDB

↓

Repository

↓

Service

↓

Controller

↓

HTTP Response

↓

Frontend UI

Every feature in the application must follow this exact request lifecycle.

No layer may skip another.

⸻

Step 1 — Audit the Current Codebase

Before changing anything:

Analyze the entire backend.

Document:

Controllers
Routes
Models
Utilities
Middleware
Helper functions
Shared logic
Duplicate code
Direct database access
Authentication flow

Produce a refactoring plan before modifying files.

⸻
Step 2 — Thin Controllers

Controllers must only:

receive request
read params/body/query
call one service method
return HTTP response

Controllers must NOT:

contain business logic
hash passwords
generate JWTs
send emails
perform database queries
implement validation
contain authorization rules

Example architecture:

Controller

↓

Service

↓

Response

⸻
Step 3 — Introduce Service Layer

Create:

src/services/

Examples:

AuthService

UserService

PortfolioService

CommentService

NotificationService

Each service owns business logic.

Examples:

Registration

Password hashing

Login

Token generation

Portfolio rules

Comment rules

Permission checks

Verification logic

Email sending orchestration

Services may call multiple repositories.

Services never return Express responses.

Services should return plain JavaScript objects or domain results.

⸻

Step 4 — Introduce Repository Layer

Create:

src/repositories/

Examples:

UserRepository

PortfolioRepository

CommentRepository

NotificationRepository

Repositories are the ONLY layer allowed to communicate directly with MongoDB models.

Repositories may perform:

find()

findOne()

create()

update()

delete()

aggregate()

populate()

No controller or service should import a Mongoose model directly.

Controllers → NEVER touch MongoDB.

Services → NEVER touch MongoDB.

Only repositories interact with models.

⸻
Step 5 — Dependency Direction

Maintain strict dependency flow.

Allowed:

Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Models

Forbidden:

Controller → Model

Controller → Database

Service → Express Response

Repository → HTTP Response

Repository → JWT

Repository → Email Service

Repository → Business Rules

No layer should skip another.

⸻

Step 6 — Apply SOLID Principles

Single Responsibility Principle

Every class/module should have one reason to change.

Examples:

AuthService

Only authentication.

PortfolioService

Only portfolio business rules.

EmailService

Only email operations.

UserRepository

Only persistence.

⸻

Open/Closed Principle

Write code that is easy to extend.

Avoid large switch statements.

Avoid giant if/else chains.

⸻

Liskov Substitution Principle

Maintain interface consistency.

Derived implementations should behave exactly like their contracts.

⸻

Interface Segregation Principle

Keep interfaces focused.

Do not create large “God” services.

Split responsibilities into focused modules.

⸻

Dependency Inversion Principle

Depend on abstractions where practical.

Avoid tight coupling.

Inject dependencies when appropriate.

Keep modules replaceable and testable.

⸻
Step 7 — Preserve Existing Middleware Pipeline

Request order must remain:

Route

↓

Authentication Middleware

↓

Authorization Middleware (if applicable)

↓

Validation Middleware

↓

Controller

↓

Service

↓

Repository

↓

MongoDB

Do not move authentication into controllers.

Do not duplicate middleware logic.

⸻

Step 8 — Preserve Existing Features

All existing functionality must continue working exactly as before, including:

Authentication

Registration

Login

Logout

Logout everywhere

JWT verification

Refresh tokens

Session expiration

Email verification

Portfolio CRUD

Comments

Likes

Role-based permissions

Profile management

Admin functionality

Uploads

Notifications

Error handling

Validation

Security middleware

Every endpoint must behave identically after the refactor.

⸻

Step 9 — Error Propagation

Repositories throw persistence errors.

↓

Services convert them into domain errors where appropriate.

↓

Controllers never contain try/catch unless absolutely necessary.

↓

Global Error Middleware formats the final response.

No duplicate error handling.

⸻

Step 10 — File Organization

Organize code into:

src/

config/

controllers/

services/

repositories/

models/

routes/

middleware/

validators/

utils/

constants/

errors/

helpers/

types/

No circular dependencies.

No duplicate utilities.

No business logic inside routes.

⸻

Step 11 — Maintain API Compatibility

Verify after every refactor that:

Every endpoint URL remains unchanged.

Every request body remains unchanged.

Every response body remains unchanged.

Every status code remains unchanged.

Every frontend request still succeeds.

No frontend code should need updating.

⸻
Step 12 — Incremental Refactoring Strategy

Do NOT refactor the entire application in one pass.

Refactor feature-by-feature.

For each feature:

Analyze current implementation.
Move business logic into a service.
Move persistence into a repository.
Update controller to call the service.
Run regression checks.
Confirm identical behavior.
Proceed to the next feature.

Complete one feature before starting another.

⸻

Step 13 — Code Quality Requirements

The refactored code must be:

Modular
Readable
Maintainable
Production-ready
SOLID compliant
Consistent
Fully typed where applicable
Free of duplicated logic
Easy to unit test
Easy to extend
Backwards compatible

⸻

Final Verification Checklist

Before considering the refactor complete, verify:

No functionality has changed.
No API contract has changed.
No route has changed.
No frontend code requires modification.
Controllers are thin.
Services contain all business logic.
Repositories contain all database access.
Models are accessed only by repositories.
Middleware order is preserved.
SOLID principles are consistently applied.
Request flow strictly follows:

Frontend → Axios → Routes → Authentication Middleware → Validation Middleware → Controller → Service → Repository → MongoDB → Repository → Service → Controller → HTTP Response → Frontend.

If any proposed change risks breaking compatibility, preserve the existing behavior and choose the safest architectural refactor instead.

This prompt is intentionally conservative: it instructs the AI to improve the architecture while treating backward compatibility as a hard requirement, reducing the chance of regressions during the refactor.
