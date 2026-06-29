P1 / FE-004 — Trusted Cookie Session Integration

Do this before Phase 2 settings, domains, documents, or chat. FE-001 through FE-003 have established the API boundary, authenticated shell, rail, Settings entry, and stable visual frame; the missing proof is a real backend session flowing through that shell.

Critical reconciliation: FE-002 currently normalizes a user with email and optional displayName, while greenfield P1 defines username-based identity, opaque HttpOnly sessions, and server-authoritative roles. Resolve that mismatch now; do not carry legacy bearer-token assumptions forward.

This slice delivers:

seeded admin
→ frontend login
→ HttpOnly cookie session
→ GET /api/v1/auth/me restores shell after reload
→ member/admin nav renders from backend role
→ logout revokes session and returns to login

It is an intentional frontend-first sequencing adjustment: retain FE-001–003, implement the missing P1 backend truth, then wire the existing shell to it. Cross-phase alignment remains authoritative over legacy frontend behavior.

# Context Engine — P1 / FE-004 Trusted Cookie Session Integration

Act as a senior full-stack architect and implementation engineer.

Implement the next coordinated greenfield vertical slice:

```text
P1 / FE-004 — Trusted Cookie Session Integration
```

## Objective

Connect the completed frontend foundation and authenticated shell to the real greenfield Phase 1 backend.

Target result:

```text
seed admin from environment
→ user opens /login
→ username/password login succeeds
→ backend issues opaque HttpOnly session cookie
→ browser calls GET /api/v1/auth/me with credentials included
→ existing framed AppShell renders
→ reload retains authenticated session
→ role-aware navigation uses backend role
→ logout revokes session and redirects to /login
```

Do not start Phase 2 provider settings, domain lifecycle, documents, LightRAG, upload, retrieval, chat, SSE, graph data, operations, or diagnostics.

---

## Binding source precedence

Follow this order when sources conflict:

1. `CONTEXT.md`
2. `00-cross-phase-alignment.md`
3. `development-scafold.md`
4. `p1-trusted-application-foundation.md`
5. Existing completed frontend implementation records:

   * `FE-001-runtime-foundation.md`
   * `FE-002-app-shell-nav-settings-entry.md`
   * `FE-003-original-layout-healing.md`
6. Old Context Engine and Local Studio code as reference evidence only.

Existing FE-001 through FE-003 are baseline work. Extend and correct them. Do not replace their layout, rail, design tokens, or ownership model without a concrete defect.

---

# 1. Required reconciliation before coding

Record and resolve these mismatches in a short implementation note:

| Concern                 | Required target                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Browser auth            | Cookie-only; no bearer token persistence                                                |
| Identity field          | Canonical backend identity is `username`, not legacy `email`                            |
| Session source of truth | Backend database session + HttpOnly cookie                                              |
| Role source of truth    | Backend database role; frontend only uses role for UI visibility                        |
| API route prefix        | Use one canonical `/api/v1` contract path                                               |
| Browser API client      | Existing `createApiClient()` / transport remains sole browser boundary                  |
| UI session model        | Map safe backend DTO into frontend `CurrentUser`; do not pass raw DTO across components |
| Shell behavior          | Existing FE-003 framed layout and compact rail remain intact                            |

Replace the FE-002 frontend `CurrentUser` assumption:

```ts
type CurrentUser = {
  id: string
  username: string
  role: "member" | "admin"
  isActive: boolean
}
```

A display label may derive from `username`, but do not invent or require `email` or `displayName`.

---

# 2. Backend scope — Phase 1 completion

Implement or audit and correct the Phase 1 backend only.

## Required runtime

```text
postgres
→ migrate
→ FastAPI API
```

No Redis, worker, queue, LightRAG, provider SDK, Docker socket, controller, or extra service.

## Required backend capabilities

### Configuration

Add validated server configuration for:

```text
DATABASE_URL
SEED_ADMIN_USERNAME
SEED_ADMIN_PASSWORD
SESSION_TTL_HOURS
COOKIE_SECURE
allowed frontend origin(s)
```

Rules:

```text
seed admin reconciles at API startup
seed admin password is never logged
production cookie security is configuration-owned
CORS allows explicit approved origins with credentials
never use wildcard origin with credentials
```

### Database

Create/verify:

```text
users
auth_sessions
```

Rules:

```text
users:
  id
  username unique
  password_hash
  role = member | admin
  is_active
  timestamps

auth_sessions:
  id
  user_id
  token_hash only
  created_at
  expires_at
  revoked_at nullable
```

Use Argon2id password hashing.

Generate a random opaque session token. Store only its SHA-256 hash.

### Required API contract

Implement these routes under one canonical prefix:

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
GET  /api/v1/admin/users
```

`GET /api/v1/admin/users` exists only to prove server-side admin authorization in Phase 1. Do not build a Users frontend panel yet.

#### Login

Request:

```json
{
  "username": "admin",
  "password": "secret"
}
```

Success:

```text
Set-Cookie: ce_session=<opaque token>
HttpOnly
SameSite=Lax
Path=/
Secure controlled by environment
```

Safe response body:

```json
{
  "id": "uuid",
  "username": "admin",
  "role": "admin",
  "is_active": true
}
```

Never return:

```text
raw session token
password hash
session ID
provider secrets
internal paths
database details
```

#### Current user

`GET /api/v1/auth/me` returns the same safe user DTO when session is valid.

For missing, expired, revoked, malformed, or disabled sessions:

```text
401
code = authentication_required
```

Do not reveal why session validation failed.

#### Logout

```text
POST /api/v1/auth/logout
→ revoke matching active session where present
→ clear cookie
→ return 204
```

Logout must remain idempotent when no valid session exists.

### Error contract

Use one typed safe error envelope throughout Phase 1.

Include only safe fields such as:

```text
code
message
field_errors when validation is safe
request_id when available
```

Do not return stack traces, database errors, token details, or raw exception messages.

### Authorization

```text
require_current_user
require_admin
```

Rules:

```text
anonymous admin request → 401
member admin request → 403
admin admin request → 200
frontend hidden navigation never substitutes for backend authorization
```

---

# 3. Frontend scope — FE-004

Use the existing `webui/` architecture and FE-003 visual frame.

## Build

### Public login route

Create:

```text
/app/(public)/login/page.tsx
features/auth/LoginForm.tsx
features/auth/api.ts
features/auth/session.tsx or existing equivalent
```

Login form requirements:

```text
username field
password field
autocomplete attributes
Enter submits
submit disabled while pending
inline validation
generic invalid-credentials message
safe network error
visible focus styles
```

Do not add:

```text
password reset
remember me
SSO
MFA
signup
browser token persistence
```

### Session state

Implement only:

```ts
type SessionState =
  | { status: "loading" }
  | { status: "authenticated"; user: CurrentUser }
  | { status: "unauthenticated" }
```

Rules:

```text
session bootstrap calls GET /api/v1/auth/me
authenticated app layout waits for bootstrap
no protected-content flash
401 clears frontend session and routes safely to login
403 does not clear a valid session
all browser requests use credentials: include
```

### Safe return navigation

Support:

```text
/login?next=/chat
```

Accept only same-origin relative app paths.

Reject:

```text
https://external.example
//external.example
javascript:
malformed values
```

Default destination after login:

```text
/chat
```

### Logout

Add one minimal authenticated logout affordance without redesigning Settings.

Preferred placement:

```text
existing Settings dialog footer or compact rail utility area
```

Behavior:

```text
click Sign out
→ POST /api/v1/auth/logout
→ clear frontend session state
→ redirect /login
```

Do not build a General Settings feature in this slice.

### Existing shell integration

Keep:

```text
FE-003 framed work surface
compact fixed rail
existing route shells
theme persistence behavior
role-aware navigation module
Settings focus restoration
```

Update only the session wiring and user DTO mapping needed to make the shell real.

No raw `fetch` inside components.

All auth endpoint calls belong in:

```text
features/auth/api.ts
```

All wire DTOs map once into feature-safe frontend models.

---

# 4. Explicit exclusions

Do not add:

```text
JWT
Authorization bearer headers
localStorage/sessionStorage auth token
legacy bearer migration fallback in browser
React Query/global data cache
generic auth framework
generic permissions framework
user management UI
provider settings UI
parser settings UI
domains UI
document library data
upload
operations data
chat transport
SSE
graph data
diagnostics
```

Do not change the current design direction into a Local Studio clone.

---

# 5. Required tests

## Backend tests

Prove:

```text
migration runs on blank Postgres
seed admin exists after startup
valid login sets HttpOnly cookie
login JSON contains no token
GET /auth/me works with valid cookie
invalid/missing/revoked/expired cookie returns same safe 401 shape
logout revokes cookie-backed session
member gets 403 from admin route
admin gets 200 from admin route
password/token/cookie values never appear in logs or API responses
OpenAPI snapshot passes
```

Use test fixtures for member users. Do not create permanent non-admin seed users.

## Frontend unit tests

Prove:

```text
auth API uses credentials include
login request sends username/password only
CurrentUser maps username correctly
no token is read or written in localStorage/sessionStorage
unsafe next values are rejected
401 transitions session to unauthenticated
403 preserves authenticated session
```

## Playwright tests

Prove:

```text
admin login reaches /chat framed shell
reload preserves session through cookie
logout returns user to /login
direct protected route redirects to login when session absent
member fixture renders member-safe navigation
member direct admin route shows forbidden state
existing FE-003 shell geometry/theme tests remain passing
```

---

# 6. Required deliverables

Create or update:

```text
backend Phase 1 implementation
Alembic migration
backend tests
OpenAPI snapshot / API contract note
frontend login route
frontend auth/session feature
frontend tests
Playwright tests
short implementation record:
  FE-004-trusted-cookie-session-integration.md
```

The implementation record must state:

```text
what changed
exact API routes and DTO shape
frontend/backed DTO mapping
cookie policy
CORS policy
tests run and result
known deferred work
```

---

# 7. Completion gate

This slice is done only when:

```text
docker compose up --build
→ seed admin login succeeds in browser
→ shell loads through GET /api/v1/auth/me
→ browser reload keeps authenticated session
→ member/admin role behavior is correct
→ logout revokes server session
→ no browser bearer token exists
→ frontend lint, unit, and e2e tests pass
→ backend tests and OpenAPI snapshot pass
```

Do not proceed to Phase 2 until this gate is green.
