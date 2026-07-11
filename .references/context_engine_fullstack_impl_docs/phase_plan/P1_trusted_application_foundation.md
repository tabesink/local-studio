# P1 - Trusted Application Foundation

Goal: empty trusted API. Users sign in. API knows Member vs Administrator.

## Build

- FastAPI app factory/composition root.
- Postgres + Alembic.
- `users`.
- `auth_sessions`.
- seed Administrator from `.env` on API startup.
- opaque random cookie token.
- DB stores token hash only.
- Argon2id passwords.
- `require_current_user`.
- `require_admin`.
- request ID middleware.
- canonical error envelope.
- health/auth/admin proof routes.

## Do Not Build

- browser UI
- JWT
- localStorage/sessionStorage token
- user-management UI
- CLI/bootstrap command
- providers/config
- domains
- source docs
- workers
- LightRAG
- chat
- Redis/RQ/Celery

## API Contract

```text
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
GET  /api/v1/admin/users   # proof route, admin only
GET  /health/live
GET  /health/ready
```

Login returns safe user + session expiry. It sets `ce_session` HttpOnly cookie. JSON contains no token.

Errors use:

```text
{ error: { code, message, requestId, fields? } }
```

## Data

`users`:

- `id`
- `username`
- `password_hash`
- `role = member | admin`
- `is_active`
- timestamps

`auth_sessions`:

- `id`
- `user_id`
- `token_hash`
- `expires_at`
- `revoked_at`
- timestamps

## Test Gate

- fresh migration works.
- seed admin exists after startup.
- seed admin password rotates by `.env` + API restart.
- member login sets HttpOnly SameSite cookie.
- login JSON has no token.
- `/auth/me` works with cookie.
- member gets `403` on admin route.
- admin gets `200`.
- logout revokes session and clears cookie.
- revoked/expired/disabled user returns safe `401`.
- no token/password/hash in response, DB plaintext, logs, URL.

## Handoff

P2 can assume admin routes, safe errors, request IDs, migrations, and role checks exist.

