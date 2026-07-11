# Context Engine — Phase 1: Trusted Application Foundation

**Status:** Greenfield implementation plan  
**Build style:** API-first. Junior-dev friendly.  
**Goal:** Safe empty backend. Users sign in. API knows member vs admin. No browser UI yet.  
**Depends on:** Greenfield scaffold.  
**Deferred:** Browser, domains, docs, LightRAG, workers, queues, providers, chat, analytics, durable chat history.

---

## 0. Read This First

### Build target

```text
API client / curl / tests
        ↓
Context Engine API
        ↓
PostgreSQL
```

Phase 1 proves:

```text
member login
→ session cookie
→ GET /auth/me works
→ member blocked from admin route
→ admin allowed
→ logout/revoked session blocked
```

### Do not build

```text
Next.js
React
browser login page
JWT
localStorage token
Redis
RQ/Celery
workers
domains
documents
uploads
LightRAG
provider settings
chat
SSE
Docker socket access
CLI / operator commands
user management UI
```

Reason: Phase 1 = trusted base. Nothing else. Admin from `.env` only; members for tests via fixtures.

---

## 1. Core Rules

1. Browser later talks only to Context Engine API.
2. API owns auth + roles.
3. PostgreSQL owns users + sessions.
4. Session uses opaque random cookie token.
5. DB stores token hash only. Never raw token.
6. Cookie is HttpOnly. Browser JS cannot read it.
7. Role comes from DB. Client never sends trusted role.
8. Two roles only: `member`, `admin`.
9. Seed admin from `.env` on API startup. No CLI.
10. All admin routes use server-side `require_admin`.
11. All errors use one typed shape.
12. No secrets in API response, logs, URLs, browser state.
13. OpenAPI generated from FastAPI models. One contract source.

---

## 2. Done Means

Phase complete only when all pass:

```text
1. docker compose up --build works.
2. PostgreSQL starts.
3. Alembic migration runs.
4. Seed admin reconciled from `.env` on API startup.
5. Test fixtures can insert member users for authorization tests.
6. Member login returns HttpOnly cookie.
7. Login JSON contains no token.
8. Member GET /api/v1/auth/me = 200.
9. Member GET /api/v1/admin/users = 403.
10. Admin GET /api/v1/admin/users = 200.
11. Logout clears cookie.
12. Revoked session GET /api/v1/auth/me = 401.
13. pytest passes.
14. OpenAPI snapshot test passes.
```

---

## 3. Runtime

## Containers

| Container | Job | Public? | Data |
|---|---|---:|---|
| `postgres` | Users + sessions DB | No | `postgres_data` volume |
| `migrate` | Runs Alembic once | No | None |
| `api` | FastAPI API | Local dev port only | None |

## Docker Compose flow

```text
postgres healthy
→ migrate: alembic upgrade head
→ api starts
→ lifespan: ensure seed admin from .env
→ /health/live = 200
→ /health/ready = 200
```

## Compose rules

- `postgres` no host port by default.
- `api` gets local port, example `8010:8010`.
- `migrate` exits after success.
- `api` depends on successful `migrate`.
- `postgres_data` named volume.
- No Docker socket.
- No Redis.
- No extra service.

---

## 4. Repo Layout

Create this. Keep names stable.

```text
context-engine/
├── docker-compose.yml
├── .env.example
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   │       └── 0001_users_and_sessions.py
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── dependencies/
│   │   │   │   ├── current_user.py
│   │   │   │   └── require_admin.py
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── admin_users.py
│   │   │       └── health.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── errors.py
│   │   │   ├── request_id.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   ├── models/
│   │   │   │   ├── user.py
│   │   │   │   └── auth_session.py
│   │   │   └── repositories/
│   │   │       ├── users.py
│   │   │       └── sessions.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── errors.py
│   │   │   └── users.py
│   │   └── services/
│   │       ├── authentication.py
│   │       └── sessions.py
│   └── tests/
│       ├── conftest.py
│       ├── integration/
│       │   └── test_auth_authorization.py
│       └── unit/
│           ├── test_authorization.py
│           ├── test_passwords.py
│           └── test_sessions.py
└── docs/
    └── api/
        ├── openapi.phase-1.json
        └── phase-1-contract.md
```

## File ownership

| File/group | Owns |
|---|---|
| `main.py` | app factory, lifespan seed admin, router registration, middleware |
| `config.py` | env config validation |
| `security.py` | password hash + random token helpers |
| `errors.py` | typed app exceptions + error handler |
| `request_id.py` | request ID middleware |
| `models/` | SQLAlchemy DB tables |
| `repositories/` | DB queries only |
| `services/` | auth/session business rules |
| `dependencies/` | current user + admin checks |
| `api/v1/` | HTTP req/res only |
| `alembic/` | migration history |
| `tests/` | proof |

Bad:

```text
route does SQL + password verify + session create
frontend owns role check
client sends role
raw token stored in DB
raw token logged
```

---

## 5. Dependencies

Use small set.

```text
fastapi
uvicorn
sqlalchemy
alembic
psycopg[binary]
pydantic-settings
argon2-cffi
httpx
pytest
pytest-asyncio
```

Optional only if team already uses it:

```text
structlog
ruff
mypy
```

Do not add:

```text
passlib if not needed
JWT library
Redis client
Celery/RQ
ORM repository framework
auth framework
permission framework
event framework
CLI framework (typer/click/etc.)
```

---

## 6. Database Model

## 6.1 Users

Table: `users`

```ts
type UserRole = "member" | "admin";

type User = {
  id: string;             // UUID
  username: string;       // unique login name
  passwordHash: string;   // Argon2id hash
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};
```

Rules:

```text
username unique
role only member/admin
passwordHash never API output
disabled user cannot login
seed admin owned by .env only
Phase 1: no user create/disable API, no CLI — members only in test fixtures
```

## 6.2 Sessions

Table: `auth_sessions`

```ts
type AuthSession = {
  id: string;             // UUID
  userId: string;         // FK users.id
  tokenHash: string;      // SHA-256(raw cookie token)
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};
```

Rules:

```text
raw token = random 256-bit minimum
DB holds SHA-256 hash only
tokenHash unique
session valid only when:
  revokedAt is null
  expiresAt > now
  linked user exists
  linked user isActive = true
```

## 6.3 Required indexes

```text
users:
  PK id
  UNIQUE username

auth_sessions:
  PK id
  UNIQUE token_hash
  INDEX token_hash
  INDEX user_id
  INDEX expires_at
  FK user_id -> users.id ON DELETE CASCADE
```

## 6.4 First migration

Create:

```text
0001_users_and_sessions
```

Must:

```text
create users
create auth_sessions
create constraints/indexes
support downgrade in dev
run on blank Postgres
```

No DB schema copied from v1. Greenfield starts clean.

---

## 7. Session Design

## 7.1 Why opaque session, not JWT

```text
JWT:
  browser holds token
  revoke hard
  localStorage risk
  extra complexity

Opaque session:
  browser holds HttpOnly cookie
  DB can revoke
  role checked fresh
  small app fit
```

## 7.2 Login flow

```text
POST /api/v1/auth/login
→ validate username/password
→ find active user
→ verify Argon2id hash
→ generate random token
→ hash token
→ insert auth_sessions row
→ Set-Cookie ce_session=<raw token>
→ return safe user object
```

## 7.3 Cookie rules

| Field | Value |
|---|---|
| Name | `ce_session` |
| HttpOnly | `true` |
| SameSite | `Lax` |
| Path | `/` |
| Domain | host-only |
| Secure | `false` local dev; `true` staging/prod |
| Max-Age | session TTL |
| Raw token in response JSON | never |
| localStorage/sessionStorage | never |

## 7.4 Session read flow

```text
request cookie ce_session
→ SHA-256 cookie value
→ find DB session by tokenHash
→ check not revoked
→ check not expired
→ join user
→ check user active
→ create CurrentUser
```

Invalid session:

```text
401
code = unauthenticated
same response for:
  missing cookie
  bad token
  expired token
  revoked token
  disabled user
```

Do not reveal why.

## 7.5 Logout flow

```text
POST /api/v1/auth/logout
→ revoke matching active session if found
→ clear ce_session cookie
→ return 204
```

No valid session? Still:

```text
clear cookie
return 204
```

Idempotent. Good for future browser.

---

## 8. Password Rules

Use Argon2id. Do not write crypto code.

```python
# Concept only. Use maintained library API.
hash_password(password) -> str
verify_password(password, stored_hash) -> bool
```

Rules:

```text
password not logged
password not returned
invalid username and invalid password return same 401
```

Phase 1 no:

```text
password reset flow
invite flow
OAuth
SSO
MFA
account self-service
```

---

## 9. Roles + Server Authorization

## 9.1 Roles

```text
member:
  authenticated user
  no admin powers

admin:
  member powers
  admin routes
```

## 9.2 Dependencies

```python
CurrentUser = Depends(require_current_user)
AdminUser = Depends(require_admin)
```

Concept:

```python
def require_current_user(
    session_cookie: str | None,
    session_service: SessionService,
) -> CurrentUser:
    # resolve DB-backed active session
    ...

def require_admin(
    current_user: CurrentUser = Depends(require_current_user),
) -> CurrentUser:
    if current_user.role != "admin":
        raise ForbiddenError()
    return current_user
```

Rules:

```text
role from DB
not request body
not query param
not hidden UI
not cookie claim
not frontend state
```

## 9.3 Route access

| Route | Anonymous | Member | Admin |
|---|---:|---:|---:|
| `/health/live` | yes | yes | yes |
| `/health/ready` | yes | yes | yes |
| `POST /auth/login` | yes | yes | yes |
| `POST /auth/logout` | 204 | 204 | 204 |
| `GET /auth/me` | 401 | 200 | 200 |
| `GET /admin/users` | 401 | 403 | 200 |

---

## 10. API Contract

All app routes:

```text
/api/v1
```

Health routes stay unversioned.

## 10.1 Health

### `GET /health/live`

No DB call.

```json
{"status":"ok"}
```

### `GET /health/ready`

Checks DB connection.

Success:

```json
{"status":"ready"}
```

DB down:

```http
503
```

```json
{
  "error": {
    "code": "service_unavailable",
    "message": "Service unavailable.",
    "requestId": "..."
  }
}
```

Never expose DB host, URL, user, env, stack trace.

---

## 10.2 Login

### `POST /api/v1/auth/login`

Request:

```json
{
  "username": "member1",
  "password": "user password"
}
```

Success `200`:

```json
{
  "user": {
    "id": "uuid",
    "username": "member1",
    "role": "member"
  },
  "sessionExpiresAt": "2026-06-27T12:00:00Z"
}
```

Also:

```http
Set-Cookie: ce_session=<opaque random token>; HttpOnly; SameSite=Lax; Path=/
```

Failure:

```http
401
```

```json
{
  "error": {
    "code": "unauthenticated",
    "message": "Invalid username or password.",
    "requestId": "..."
  }
}
```

No token in JSON. No `accessToken`. No `refreshToken`.

---

## 10.3 Current user

### `GET /api/v1/auth/me`

Success `200`:

```json
{
  "user": {
    "id": "uuid",
    "username": "member1",
    "role": "member"
  },
  "sessionExpiresAt": "2026-06-27T12:00:00Z"
}
```

No session token. No password hash. No DB fields.

---

## 10.4 Logout

### `POST /api/v1/auth/logout`

Success:

```http
204 No Content
Set-Cookie: ce_session=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/
```

Always `204`. Valid or invalid cookie.

---

## 10.5 Admin proof route

### `GET /api/v1/admin/users`

Why exist now:

```text
Need real admin route.
Need prove member/admin gate.
Future UI can use later.
```

Response `200`:

```json
{
  "users": [
    {
      "id": "uuid",
      "username": "admin",
      "role": "admin",
      "isActive": true,
      "createdAt": "2026-06-26T12:00:00Z"
    }
  ]
}
```

Member response:

```http
403
```

```json
{
  "error": {
    "code": "forbidden",
    "message": "Admin access required.",
    "requestId": "..."
  }
}
```

---

## 11. Error Contract

All app errors use one shape.

```ts
type ApiError = {
  error: {
    code:
      | "unauthenticated"
      | "forbidden"
      | "not_found"
      | "conflict"
      | "validation_failed"
      | "service_unavailable"
      | "internal_error";
    message: string;
    requestId: string;
    fields?: Array<{
      field: string;
      code: string;
      message: string;
    }>;
  };
};
```

## Status map

| HTTP | Code | Use |
|---:|---|---|
| 401 | `unauthenticated` | no/invalid session, bad login |
| 403 | `forbidden` | authenticated, wrong role |
| 404 | `not_found` | future resource missing |
| 409 | `conflict` | duplicate username, future state conflict |
| 422 | `validation_failed` | bad request body |
| 503 | `service_unavailable` | DB readiness fails |
| 500 | `internal_error` | unexpected failure |

## Rules

```text
request ID on all req/res
return X-Request-ID header
log internal detail with request ID
return safe message only
never return:
  traceback
  SQL
  DB URL
  token
  password
  secret
```

---

## 12. Request ID

Middleware:

```text
read X-Request-ID if valid UUID/string format
or create UUID
store in request state
add X-Request-ID to response
include in error JSON
```

Logs include:

```text
request_id
method
path
status
duration_ms
user_id only after auth, optional
```

Do not log:

```text
cookie
Authorization header
password
raw request body by default
```

---

## 13. Config

`.env.example`

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://context_engine:change-me@postgres:5432/context_engine
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=change-me
SESSION_TTL_HOURS=168
COOKIE_SECURE=false
LOG_LEVEL=INFO
```

Rules:

| Setting | Rule |
|---|---|
| `APP_ENV` | `development`, `test`, `production` only |
| `DATABASE_URL` | required |
| `SEED_ADMIN_USERNAME` | required; seed admin login name |
| `SEED_ADMIN_PASSWORD` | required; reject weak values in `production`/`staging` |
| `SESSION_TTL_HOURS` | positive int |
| `COOKIE_SECURE` | true outside development |
| prod + insecure cookie | app startup fails |
| unknown env | reject or log clearly |

Do not add future config now.

---

## 13.1 Seed admin

Admin comes from `.env`. No CLI.

On API startup (lifespan, before serving requests):

```text
read SEED_ADMIN_USERNAME + SEED_ADMIN_PASSWORD
→ UserRepository.ensure_seed_admin(username, password)
→ upsert admin user: role=admin, isActive=true, password hash synced
```

Idempotent. Safe on every restart. Password rotation = change `.env` + restart API.

Rules:

```text
seed admin owned by .env only
no CLI, no operator entrypoint
never log SEED_ADMIN_PASSWORD
do not commit real .env; .env.example uses placeholders only
members for authorization tests: insert via test fixtures only
```

Implementation lives in `main.py` lifespan + `UserRepository.ensure_seed_admin`.

---

## 14. No CLI

Phase 1 has **no operator CLI**. No `context-engine` command. No Typer/Click app.

```text
admin     → .env + lifespan ensure_seed_admin
members   → test fixtures only (direct DB insert or repository helper in tests)
operators → docker compose up; change .env; restart API to rotate admin password
```

User management HTTP routes (create/disable/reset) are **deferred** to a later phase with browser admin UI.

Phase 1 admin HTTP surface is read-only proof route only: `GET /admin/users`.

---

## 15. Build Order

Do steps in order. Do not jump.

## Step 1 — Skeleton

Build:

```text
pyproject
FastAPI app factory
config
Dockerfile
docker-compose
Postgres health check
migrate service
health routes
request ID middleware
```

Check:

```bash
docker compose up --build
curl http://localhost:8010/health/live
curl http://localhost:8010/health/ready
```

Expected:

```text
live = 200
ready = 200 after DB ready
```

---

## Step 2 — DB + migration + seed admin

Build:

```text
SQLAlchemy base/session
User model
AuthSession model
Alembic
0001 migration
repositories
UserRepository.ensure_seed_admin
main.py lifespan hook
```

Check:

```bash
docker compose exec api alembic current
docker compose up --build
```

Expected:

```text
0001_users_and_sessions
api startup completes
users table has seed admin row (username from SEED_ADMIN_USERNAME, role=admin)
restart api → same admin row, idempotent
```

---

## Step 3 — Password + sessions

Build:

```text
Argon2id helpers
random token generator
SHA-256 token hash
SessionRepository
SessionService
AuthenticationService
login/logout/me routes
cookie config
```

Check:

```text
login JSON no token
Set-Cookie exists
DB token_hash exists
raw token absent from DB
admin login with SEED_ADMIN_USERNAME works
change SEED_ADMIN_PASSWORD + restart → new password works
```

---

## Step 4 — Role gate

Build:

```text
require_current_user
require_admin
GET /admin/users
typed errors
```

Check:

```text
member /admin/users = 403
admin /admin/users = 200
anonymous /admin/users = 401
```

---

## Step 5 — Contract + tests

Build:

```text
OpenAPI snapshot
integration tests
unit tests
README
```

Check:

```bash
pytest
```

Expected:

```text
all green
```

---

## 16. Tests

## 16.1 Unit

| Test | Must prove |
|---|---|
| password hash | original password works; wrong password fails |
| password output | hash not in response DTO |
| token generator | new token each call |
| session DB | raw token never saved |
| session expiry | expired = invalid |
| session revoke | revoked = invalid |
| disabled user | disabled = invalid |
| require_admin | member raises forbidden |
| username unique | duplicate username rejected |
| ensure_seed_admin | upsert idempotent; password sync on restart |
| errors | typed contract output |

## 16.2 Integration

```text
1. seed admin from .env (lifespan or test settings override)
2. insert member via test fixture (not CLI, not HTTP)
3. member login
4. assert no accessToken/refreshToken/token JSON fields
5. assert Set-Cookie has HttpOnly + SameSite=Lax
6. member GET /auth/me = 200
7. member GET /admin/users = 403 forbidden
8. admin login (SEED_ADMIN_USERNAME)
9. admin GET /admin/users = 200
10. logout = 204 + cookie cleared
11. old session GET /auth/me = 401
12. disabled user login = 401
13. wrong username and wrong password same safe 401 shape
14. each response has X-Request-ID
15. bad body = 422 validation_failed
```

## 16.3 Compose

```text
fresh DB → migration works
API starts after migration
lifespan seed admin before ready
DB down → /health/ready = 503
API restart does not lose DB users/sessions
API restart re-syncs seed admin password from .env
test env cannot use dev/prod DATABASE_URL
```

## 16.4 No browser tests now

Use `httpx` test client cookie jar.

Reason:

```text
prove HTTP contract now
browser later consumes same contract
no frontend code yet
```

---

## 17. Security Checks

Before mark done, verify:

```text
[ ] No JWT library.
[ ] No localStorage code.
[ ] No token JSON field.
[ ] No raw token DB column.
[ ] No raw token logs.
[ ] No password logs.
[ ] No password hash API field.
[ ] Cookie HttpOnly true.
[ ] Cookie Secure true outside dev.
[ ] Member cannot access admin route.
[ ] Role checked server-side.
[ ] DB not host-exposed default.
[ ] Health route no config leak.
[ ] Error response no traceback/SQL/secret.
[ ] Seed admin password not logged.
[ ] Weak SEED_ADMIN_PASSWORD rejected in production/staging.
[ ] No CLI package or operator command.
```

---

## 18. Common Junior Dev Mistakes

| Mistake | Why bad | Correct |
|---|---|---|
| JWT in localStorage | XSS reads token; revoke harder | HttpOnly opaque cookie |
| store raw session token | DB leak = usable login | store SHA-256 hash |
| role from request body | user can claim admin | role from DB |
| route checks frontend only | user calls API direct | `require_admin` |
| return `str(error)` | leaks internals | safe typed error |
| DB query in route | logic spreads | route → service → repo |
| add Redis now | no job need | skip |
| add Next.js placeholder | dead code | skip |
| weak/default seed password in prod | known admin credentials | reject at startup in prod/staging |
| commit `.env` with seed password | secret leak | `.env.example` placeholders only; inject secrets at deploy |
| add operator CLI | extra surface, not needed Phase 1 | admin from `.env`; members in test fixtures |
| add user-management HTTP routes early | scope creep | defer to later phase with admin UI |

---

## 19. Deferred Work

Later phase adds browser. Use same API.

Future browser flow:

```text
login form
→ POST /api/v1/auth/login
→ HttpOnly cookie auto-stored by browser
→ GET /api/v1/auth/me
→ render safe user role
→ admin pages call admin endpoints
```

Future browser must not:

```text
read cookie
store token
decode token
send role
call DB
call Docker
call LightRAG
call provider
call worker
```

Before separate-origin browser deployment, add:

```text
explicit allowed origin
cookie request config
CSRF/origin rules for write requests
admin user-management HTTP routes (create/disable/reset)
```

Do not add CORS config now. No browser exists. No user-management routes now.

---

## 20. Final Definition of Done

```text
Trusted empty API exists.

User:
  login works
  session works
  current-user works

Member:
  blocked from admin route

Admin:
  allowed admin route

Operator:
  set SEED_ADMIN_* in .env
  docker compose up — admin ready, no manual bootstrap

System:
  Docker works
  migrations work
  no CLI
  errors typed
  tests green
  no browser
  no RAG
  no extra infra
```

---

## Final Boundary

```text
Phase 1:
users → sessions → auth → roles → API contract → tests.

Not Phase 1:
browser → domains → documents → jobs → LightRAG → providers → chat.
```
