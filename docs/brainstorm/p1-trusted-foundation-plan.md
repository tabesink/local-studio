# Context Engine — P1: Trusted Application Foundation (caveman)

**Goal:** Safe empty backend. Users sign in. API knows member vs admin. No browser yet.
**Depends:** greenfield scaffold.
**Reads:** P0 shared contract (auth = canonical owner of identity/sessions/roles).
**Style:** caveman. Terse. Tech exact.

---

## 0. Build target

```text
API client / curl / tests
  -> Context Engine API
  -> PostgreSQL
```

Proves:

```text
member login -> session cookie -> GET /auth/me ok
member blocked from admin route -> admin allowed
logout/revoked session blocked
```

### Do not build

```text
Next.js, React, browser login page, JWT, localStorage token,
Redis, RQ/Celery, workers, domains, documents, uploads, LightRAG,
provider settings, chat, SSE, Docker socket, CLI, user-management UI
```

P1 = trusted base. Nothing else. Admin from `.env`. Members via test fixtures.

---

## 1. Core rules

```text
1. Browser (later) talks only to CE API.
2. API owns auth + roles.
3. Postgres owns users + sessions.
4. Session = opaque random cookie token.
5. DB stores token HASH only. Never raw token.
6. Cookie HttpOnly. JS can't read.
7. Role from DB. Client never sends trusted role.
8. Two roles: member, admin.
9. Seed admin from .env on startup. No CLI.
10. Admin routes use server-side require_admin.
11. Errors -> one typed shape.
12. No secrets in response/logs/URLs/browser state.
13. OpenAPI generated from FastAPI models. One contract source.
```

### Seed admin rule (review correction)

```text
create seeded admin ONLY when absent.
existing admin -> do NOT overwrite password/role on restart.
hash password before DB write.
```

Original draft said "upsert + password sync every restart". Review says no overwrite. **Use: create-if-absent only.** Password rotation = manual admin action later, not silent .env re-sync. Keeps one owner of admin credential = DB after first boot.

---

## 2. Done means

```text
1. docker compose up --build works.
2. Postgres starts.
3. Alembic 0001 runs.
4. Seed admin created if absent on startup.
5. Test fixtures insert member users.
6. Member login -> HttpOnly cookie.
7. Login JSON has no token.
8. Member GET /api/v1/auth/me = 200.
9. Member GET /api/v1/admin/users = 403.
10. Admin GET /api/v1/admin/users = 200.
11. Logout clears cookie.
12. Revoked session GET /auth/me = 401.
13. pytest passes.
14. OpenAPI snapshot passes.
```

---

## 3. Runtime

| Container | Job | Public | Data |
|---|---|---|---|
| postgres | users + sessions | No | postgres_data volume |
| migrate | alembic once | No | None |
| api | FastAPI | local dev port | None |

Flow:

```text
postgres healthy -> migrate: alembic upgrade head -> api starts
-> lifespan: ensure seed admin if absent -> /health/live 200 -> /health/ready 200
```

Compose rules: postgres no host port default. api local port (8010:8010). migrate exits after success. api depends on migrate success. postgres_data named volume. No Docker socket. No Redis. No extra service.

---

## 4. Repo layout

```text
context-engine/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic/versions/0001_users_and_sessions.py
│   └── app/
│       ├── main.py                    # app factory, lifespan seed, routers, middleware
│       ├── api/
│       │   ├── dependencies/{current_user.py, require_admin.py}
│       │   └── v1/{auth.py, admin_users.py, health.py}
│       ├── core/{config.py, errors.py, request_id.py, security.py}
│       ├── db/
│       │   ├── {base.py, session.py}
│       │   ├── models/{user.py, auth_session.py}
│       │   └── repositories/{users.py, sessions.py}
│       ├── schemas/{auth.py, errors.py, users.py}
│       └── services/{authentication.py, sessions.py}
│   └── tests/{conftest.py, integration/, unit/}
└── docs/api/{openapi.phase-1.json, phase-1-contract.md}
```

Ownership: route = HTTP only. service = business rules. repo = SQL only. models = tables. Bad: route does SQL + verify + session create. Bad: client sends role. Bad: raw token in DB/logs.

---

## 5. Deps

```text
fastapi, uvicorn, sqlalchemy, alembic, psycopg[binary],
pydantic-settings, argon2-cffi, httpx, pytest, pytest-asyncio
```

Do not add: JWT lib, Redis client, Celery/RQ, auth framework, permission framework, event framework, CLI framework.

---

## 6. DB model

### users

```ts
type User = {
  id: string;            // UUID
  username: string;      // unique
  passwordHash: string;  // Argon2id
  role: "member" | "admin";
  isActive: boolean;
  createdAt: string;
};
```

Rules: username unique. role member/admin. passwordHash never API output. disabled user can't login. seed admin owned by .env (create-if-absent). P1 no user-create/disable API, no CLI. members in test fixtures only.

### auth_sessions

```ts
type AuthSession = {
  id: string;
  userId: string;        // FK users.id
  tokenHash: string;     // SHA-256(raw cookie token)
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};
```

Rules: raw token = random 256-bit min. DB holds SHA-256 only. tokenHash unique. Session valid only when: revokedAt null AND expiresAt > now AND user exists AND user isActive.

Indexes:

```text
users: PK id, UNIQUE username
auth_sessions: PK id, UNIQUE token_hash, INDEX user_id, INDEX expires_at,
  FK user_id -> users.id ON DELETE CASCADE
```

Migration `0001_users_and_sessions`: create both tables + constraints/indexes. Downgrade in dev. Run on blank Postgres. No v1 schema copied.

---

## 7. Session design

### Why opaque not JWT

```text
JWT -> browser holds token -> revoke hard -> localStorage risk -> complexity.
Opaque -> HttpOnly cookie -> DB revoke -> fresh role check -> fits small app.
```

### Login flow

```text
POST /api/v1/auth/login
-> validate username/password
-> find active user
-> verify Argon2id hash
-> generate random token -> hash -> insert auth_sessions row
-> Set-Cookie ce_session=<raw token>
-> return safe user object (no token)
```

### Cookie

| Field | Value |
|---|---|
| Name | ce_session |
| HttpOnly | true |
| SameSite | Lax |
| Path | / |
| Secure | false dev; true staging/prod |
| Max-Age | session TTL |
| token in JSON | never |
| localStorage | never |

### Read flow

```text
cookie ce_session -> SHA-256 -> find session by tokenHash
-> not revoked -> not expired -> join user -> user active -> CurrentUser
```

Invalid session -> `401 unauthenticated`. Same response for: missing cookie, bad token, expired, revoked, disabled user. Don't reveal why.

### Logout

```text
POST /api/v1/auth/logout
-> revoke matching active session if found
-> clear ce_session cookie
-> 204 (always, valid or not). Idempotent.
```

---

## 8. Passwords

Argon2id. Don't write crypto. Use maintained lib.

```text
hash_password(pw) -> str
verify_password(pw, stored_hash) -> bool
```

Rules: password not logged, not returned. Invalid username AND invalid password -> same 401.

P1 no: reset flow, invite, OAuth, SSO, MFA, self-service.

---

## 9. Roles + authz

```python
CurrentUser = Depends(require_current_user)
AdminUser   = Depends(require_admin)

def require_admin(current_user = Depends(require_current_user)):
    if current_user.role != "admin":
        raise ForbiddenError()
    return current_user
```

Role from DB. Not body, not query, not cookie claim, not frontend state.

Route access:

| Route | Anon | Member | Admin |
|---|---|---|---|
| /health/live | 200 | 200 | 200 |
| /health/ready | 200 | 200 | 200 |
| POST /auth/login | ok | ok | ok |
| POST /auth/logout | 204 | 204 | 204 |
| GET /auth/me | 401 | 200 | 200 |
| GET /admin/users | 401 | 403 | 200 |

---

## 10. API contract

App routes under `/api/v1`. Health unversioned.

```text
GET /health/live  -> {"status":"ok"} (no DB)
GET /health/ready -> {"status":"ready"} | 503 if DB down (no host/url/stack leak)

POST /api/v1/auth/login  -> 200 {user, sessionExpiresAt} + Set-Cookie | 401 unauthenticated
GET  /api/v1/auth/me     -> 200 {user, sessionExpiresAt} | 401
POST /api/v1/auth/logout -> 204 + cookie cleared
GET  /api/v1/admin/users -> 200 {users[]} | 403 member | 401 anon
```

No token/accessToken/refreshToken in any JSON. /admin/users exists now = prove member/admin gate.

---

## 11. Error contract

```ts
type ApiError = {
  error: {
    code: "unauthenticated" | "forbidden" | "not_found" | "conflict"
        | "validation_failed" | "service_unavailable" | "internal_error";
    message: string;
    requestId: string;
    fields?: { field: string; code: string; message: string }[];
  };
};
```

| HTTP | Code |
|---|---|
| 401 | unauthenticated |
| 403 | forbidden |
| 404 | not_found |
| 409 | conflict |
| 422 | validation_failed |
| 503 | service_unavailable |
| 500 | internal_error |

Request ID on all req/res. X-Request-ID header. Log internal detail with request ID. Return safe message only. Never return: traceback, SQL, DB URL, token, password, secret. (Schema = P0 §16.)

### One canonical error registry (DRY)

All error codes live in ONE enum in `core/errors.py`. Later phases EXTEND this enum — they do not define separate, incompatible code unions in their own modules.

```python
# core/errors.py — single source of truth
class ErrorCode(StrEnum):
    unauthenticated = "unauthenticated"
    forbidden = "forbidden"
    not_found = "not_found"
    conflict = "conflict"
    validation_failed = "validation_failed"
    service_unavailable = "service_unavailable"
    internal_error = "internal_error"
    # P2+ append here: configuration_invalid, configuration_unavailable,
    #   runtime_unavailable, no_query_eligible_source, retrieval_unavailable, ...
```

One typed `AppError` + one exception handler render the envelope. Phase docs reference codes by name; they never re-declare the shape.

### Same-origin check for cookie-authed writes

Before any browser wiring, unsafe cookie-authenticated methods (POST/PUT/PATCH/DELETE) require a trusted `Origin` (or `Referer` fallback) match. Mismatch -> `403 forbidden`.

```text
GET/HEAD               -> no origin check (safe methods).
cookie + unsafe method -> Origin must equal trusted app origin, else 403.
```

No CSRF token framework until a real requirement exceeds same-origin protection. Same-origin is the release gate, not optional (systems-slices-review §7).

---

## 12. Request ID middleware

```text
read X-Request-ID if valid, else create UUID -> request state -> response header -> error JSON.
log: request_id, method, path, status, duration_ms, user_id (after auth, optional).
don't log: cookie, Authorization, password, raw body.
```

---

## 13. Config

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://context_engine:change-me@postgres:5432/context_engine
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=change-me
SESSION_TTL_HOURS=168
COOKIE_SECURE=false
LOG_LEVEL=INFO
```

Rules: APP_ENV in {development,test,production}. DATABASE_URL required. SEED_ADMIN_* required; reject weak password in prod/staging. SESSION_TTL_HOURS positive int. COOKIE_SECURE true outside dev. prod + insecure cookie -> startup fails.

### Seed admin (create-if-absent)

```text
startup lifespan, before serving:
read SEED_ADMIN_USERNAME + PASSWORD
-> UserRepository.ensure_seed_admin_if_absent(username, password)
-> admin absent: create role=admin, isActive=true, hashed password
-> admin present: leave unchanged (no password/role overwrite)
```

Never log SEED_ADMIN_PASSWORD. Don't commit real .env. members -> test fixtures only.

---

## 14. No CLI

```text
admin     -> .env + lifespan create-if-absent
members   -> test fixtures only
operators -> docker compose up; password rotation later via admin action
```

User-management HTTP routes deferred to phase with admin UI. P1 admin surface = read-only GET /admin/users.

---

## 15. Build order

```text
Step 1 — skeleton: pyproject, app factory, config, Dockerfile, compose,
  postgres healthcheck, migrate service, health routes, request-ID middleware.
  Check: live=200, ready=200 after DB.

Step 2 — DB + migration + seed: SQLAlchemy base/session, User + AuthSession models,
  alembic 0001, repos, ensure_seed_admin_if_absent, lifespan hook.
  Check: 0001 current, admin row exists, restart -> unchanged admin.

Step 3 — password + sessions: Argon2id helpers, random token, SHA-256 hash,
  SessionRepository, SessionService, AuthenticationService, login/logout/me, cookie config.
  Check: login JSON no token, Set-Cookie exists, DB token_hash exists, raw token absent.

Step 4 — role gate: require_current_user, require_admin, GET /admin/users, typed errors.
  Check: member 403, admin 200, anon 401.

Step 5 — contract + tests: OpenAPI snapshot, integration + unit tests, README.
  Check: pytest green.
```

---

## 16. Tests

### Unit

```text
password hash works / wrong fails | hash not in DTO | token new each call |
raw token never saved | expired invalid | revoked invalid | disabled invalid |
require_admin: member raises forbidden | username unique enforced |
ensure_seed_admin_if_absent: creates once, no overwrite on restart | typed errors
```

### Integration

```text
1. seed admin from .env
2. insert member via fixture
3. member login
4. no accessToken/refreshToken/token JSON
5. Set-Cookie HttpOnly + SameSite=Lax
6. member /auth/me = 200
7. member /admin/users = 403
8. admin login
9. admin /admin/users = 200
10. logout = 204 + cookie cleared
11. old session /auth/me = 401
12. disabled user login = 401
13. wrong username and wrong password same safe 401
14. every response has X-Request-ID
15. bad body = 422
```

### Compose

```text
fresh DB -> migration works -> API after migration -> seed admin before ready
DB down -> /health/ready 503 -> restart keeps users/sessions
restart does NOT overwrite existing admin -> test env can't use dev/prod DATABASE_URL
```

No browser tests. Use httpx cookie jar.

---

## 17. Security checks

```text
[ ] No JWT lib.       [ ] No localStorage code.   [ ] No token JSON field.
[ ] No raw token DB column.   [ ] No raw token logs.   [ ] No password logs.
[ ] No password hash API field.   [ ] Cookie HttpOnly true.
[ ] Cookie Secure true outside dev.   [ ] Member can't access admin route.
[ ] Role checked server-side.   [ ] DB not host-exposed default.
[ ] Health route no config leak.   [ ] Error no traceback/SQL/secret.
[ ] Seed admin password not logged.   [ ] Weak seed password rejected prod/staging.
[ ] Seed admin create-if-absent (no overwrite).   [ ] No CLI package.
```

---

## 18. Common mistakes

| Mistake | Why bad | Correct |
|---|---|---|
| JWT in localStorage | XSS reads token | HttpOnly opaque cookie |
| store raw session token | DB leak = usable login | store SHA-256 hash |
| role from request body | user claims admin | role from DB |
| frontend-only role check | user calls API direct | require_admin |
| return str(error) | leaks internals | typed safe error |
| DB query in route | logic spreads | route -> service -> repo |
| overwrite admin every restart | clobbers rotated password | create-if-absent only |
| add Redis/Next.js now | dead code | skip |

---

## 19. Definition of done

```text
Trusted empty API exists.
User: login + session + current-user work.
Member: blocked from admin route. Admin: allowed.
Operator: set SEED_ADMIN_* -> compose up -> admin ready if absent, no manual bootstrap.
System: Docker works, migrations work, no CLI, errors typed, tests green,
  no browser, no RAG, no extra infra.
```

## Final boundary

```text
P1: users -> sessions -> auth -> roles -> API contract -> tests.
Not P1: browser -> domains -> documents -> jobs -> LightRAG -> providers -> chat.
```
