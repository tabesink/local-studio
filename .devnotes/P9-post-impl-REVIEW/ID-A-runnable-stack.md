# ID-A - Runnable stack fixture (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-010-P10-readiness.md](./F-010-P10-readiness.md)

**Question:** Can we use the old Context Engine Docker compose file to fix the frontend proxy failure?

### Decision

No. Build a current-repo fixture. The old compose is evidence for service order only.

Use:

```text
postgres
migrate
api
frontend
```

Do not copy old service names, old entrypoints, old env names, or old queue/runtime-control services unless F-010 explicitly approves a current replacement.

Accepted first-gate shape:

```text
one combined compose/local fixture
stock postgres:16
FastAPI service
Next production build/start service
HTTP smoke
no worker container
```

### Why

| Bad path | Good path |
| --- | --- |
| Copy old compose and debug drift later. | Record old-compose deltas, then write a minimal current fixture. |
| Add Postgres and call the issue fixed. | Prove API health, auth, and frontend proxy too. |
| Use old AGE/vector Postgres image immediately. | Start with stock `postgres:16`; add extensions only if migration proof requires them. |
| Use `next dev` as compose evidence. | Use production build/start in compose; document dev mode separately. |
| Revive Redis/status services because they existed before. | Add only services required by current F-010 acceptance. |
| Expose runtime/controller targets to make debugging easier. | Keep browser behind FastAPI and safe DTOs. |

The observed failure is:

```text
Next proxy -> 127.0.0.1:8000 -> connection refused
```

That means no API is listening at the proxy target. Postgres may be required for the API, but Postgres alone does not answer `/api/v1/auth/me`.

### Exact Implementation Sketch

```text
postgres
  stock postgres:16
  healthcheck gates migration

migrate
  depends on postgres healthy
  runs Alembic head
  uses CONTEXT_ENGINE_DATABASE_URL

api
  depends on migration success
  starts context_engine.app:create_app
  exposes health and /api/v1 auth
  seeds Administrator from env

frontend
  depends on api healthy or documented API start
  runs Next production build/start
  proxies /api/v1/* and /health/* to API
```

### Implement Order

1. Record old compose deltas in `specs/04-features/F-010-shared-node-operations/implementation-log.md`.
2. Add stock Postgres and migration fixture.
3. Prove migrations reach head from an empty database.
4. Add API service with current entrypoint and env names.
5. Prove `/health/live`, `/health/ready`, login, and `/auth/me`.
6. Add frontend production build/start service aligned to API.
7. Add HTTP smoke command that runs against listening services.
8. Record worker container deferral for the first gate.

### Red Flags In PR

- `DATABASE_URL` replaces `CONTEXT_ENGINE_DATABASE_URL`.
- `app.main:create_app` is used for the current API.
- Redis/RQ/Celery appears without a new approved decision.
- A worker service is added before current worker entrypoints are proven.
- A worker service is added to the first auth/proxy fixture.
- A custom Postgres image is added before migration evidence requires it.
- The canonical compose fixture runs `next dev`.
- Playwright is required for the P10 first-gate smoke.
- Browser-visible env includes database, Docker, runtime, storage, provider, or controller targets.
- Acceptance claims success before frontend proxy auth is proven.

### Tests

- Clean database migration reaches Alembic head on stock `postgres:16`.
- API health endpoints pass against the service port.
- Admin login succeeds through the API service.
- `/api/v1/auth/me` succeeds using the cookie from login.
- Production frontend `/login` loads and HTTP proxy auth paths reach API.
- Compose audit rejects stale old services/env/entrypoints.

### One-line summary

Use the old compose to learn service ordering, then build the smallest current stack that proves frontend-to-API auth.
