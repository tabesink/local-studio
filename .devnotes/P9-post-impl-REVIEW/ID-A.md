# ID-A - Runnable stack and operator boundary (P10 blockers)

Working doc for the P9-to-P10 gate. Canonical patch targets: `specs/04-features/F-010-shared-node-operations/`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/data/context-engine-data.md`, `specs/02-architecture/component-boundaries.md`, `specs/05-quality/security-and-privacy.md`, deployment/runbook files created in P10, and P10 smoke fixtures.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, DESIGN.md, F-009 spec/plan/tasks/test-plan/acceptance/implementation log/port contracts/slice map, F-010 spec/plan/tasks/test-plan/acceptance/implementation log/ux, API-001, EVT-001, DATA-001, ARCH-002, QA-002, QA-003, feature register, P9 frontend foundation files/tests, and `.references/code/context-engine/docker-compose.yml`.

**Related docs**

| Doc | Scope |
| --- | --- |
| [F-010-P10-readiness.md](./F-010-P10-readiness.md) | Broad P10 readiness, build order, acceptance gate |
| [ID-A-runnable-stack.md](./ID-A-runnable-stack.md) | Current compose/deployment fixture vs old compose evidence |
| [ID-A-api-proxy-and-admin-seed.md](./ID-A-api-proxy-and-admin-seed.md) | API proxy, env-seeded Administrator, login smoke |
| [ID-A-node-ops-contract-gate.md](./ID-A-node-ops-contract-gate.md) | Runtime Node, logs, usage, storage contract blocker |
| [ID-A-p9-carry-forward-gates.md](./ID-A-p9-carry-forward-gates.md) | P9 foundation status and remaining frontend gates |

---

## Lean Winner

```text
current-repo runnable stack
+ stock postgres:16
+ Alembic migration
+ FastAPI on the P10 API port
+ Next production frontend on the P10 frontend port
+ env-driven Administrator bootstrap
+ HTTP stack smoke
+ worker container deferral for first gate
+ no old Redis/RQ/Celery/status-poller/deployment-control copy
+ no node/logs/usage UI until contracts exist
```

This fixes the real failure mode: the frontend is running, but the backend is not listening at the proxy target.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Copy old Context Engine compose unchanged | Stale app entrypoint, stale env names, old port defaults, old queues/services, private runtime leakage risk. |
| Implement Postgres only | The proxy failure is a dead API service, not just missing database. |
| Use old custom AGE/vector Postgres image immediately | Current first-gate migrations/auth smoke do not require it; stock `postgres:16` is the accepted proof target. |
| Use `next dev` as compose evidence | P10 needs repeatable production-like smoke; dev mode is only an optional local workflow. |
| Commit a default admin password | Violates QA-002 and F-010. Use local env/ignored values only. |
| Require Playwright for the first P10 smoke | HTTP smoke proves the connection-refused proxy failure class; Playwright remains F-009 AC-007. |
| Build Logs/Usage/Runtime Node dashboard first | F-010 says first gate is runnable stack; UI needs API-001/DATA-001 patches. |
| Let browser configure Docker/runtime targets | Violates AGENTS, GOV-001, ARCH-002, QA-002, and F-010. |
| Treat P9 as complete after T-030 | Acceptance shows foundation only; SSE, Playwright, visual, preview/source-ref/graph gates remain open. |

---

## Grill Tree - Decisions Resolved

```text
Why did /login proxy fail?
  -> Next proxy targeted an API that was not running.

Will Postgres alone fix it?
  -> No. API must run, migrate, seed admin, and answer auth routes.

Can P10 use Docker/compose?
  -> Yes, as one combined current-repo fixture for the first gate.

Can it copy old compose?
  -> No. Old compose is evidence only.

Can P10 provide a committed default password in docs?
  -> No. Use env-driven local values; committed examples stay placeholders.

Can P10 build node/logs/usage surfaces now?
  -> No. Contract patch first.

Does P10 need workers for auth/proxy proof?
  -> No. Defer worker containers and record T-050 deferral.

Does P10 need Playwright for the first gate?
  -> No. Use HTTP smoke; keep Playwright in F-009 AC-007.

Can P10 proceed while full P9 is incomplete?
  -> Yes for runnable-stack foundation; no for claiming full frontend delivery.
```

---

## A1 - Runnable Stack Patch

Required service shape:

```text
stock postgres:16 -> migrate -> api -> production frontend
```

Implementation rules:

| Rule | Target |
| --- | --- |
| Use current database env name | `CONTEXT_ENGINE_DATABASE_URL` |
| Use current API app entrypoint | `context_engine.app:create_app` |
| Align API port with frontend proxy | P9 `frontend/next.config.ts` |
| Run migrations before API readiness | Alembic head proof |
| Use production frontend mode | `next build` + `next start` in compose evidence |
| Use HTTP smoke | P10 AC-001 through AC-004 |
| Defer worker container | T-050 implementation-log deferral |
| Exclude old queues/services unless approved | F-010 T-050 |

Do not add a new public API shape for the first runnable-stack gate.

---

## A2 - Admin Seed And Frontend Proxy

Current P9 frontend already has:

| File | Proof |
| --- | --- |
| `frontend/next.config.ts` | rewrites `/api/v1/*` and `/health/*` to `CONTEXT_ENGINE_API_BASE` or the default API target |
| `frontend/src/lib/api/client.ts` | shared `ceFetch`, same-origin paths, `credentials: "include"` |
| `frontend/src/state/auth-store.ts` | 401 can clear auth state without browser token persistence |
| `frontend/tests/foundation.test.mjs` | route map, storage allowlist, fetch isolation, rail order |

P10 must add live proof:

```text
POST /api/v1/auth/login
GET /api/v1/auth/me
frontend /login -> proxy -> API
```

No response may include token/password/hash material.

---

## A3 - Node/Ops Contract Gate

Runtime Node, Node Environment, scoped logs, usage/cost, storage summaries, and operator dashboards need contract patches before UI.

Target patches:

| Contract | Needed before UI |
| --- | --- |
| API-001 | endpoints, DTOs, role rules, audit outcomes, pagination/filtering |
| DATA-001 | tables/fields or explicit computed-only formulas |
| QA-002/QA-003 | redaction and log-safety proof |
| F-010 | acceptance criteria and smoke/visual evidence |

No generic JSON status blobs. No browser-computed cost/storage totals. No raw log tail.

---

## A4 - Single-Source Rules

```text
frontend_api_base =
  process.env.CONTEXT_ENGINE_API_BASE
  OR F-010 default API target
```

```text
admin_bootstrap =
  CE_ADMIN_USERNAME
  + CE_ADMIN_PASSWORD
  + backend hash/session creation
  - committed working values
```

```text
runnable_stack_ready =
  postgres healthy
  AND alembic at head
  AND API live/ready
  AND admin login succeeds
  AND /auth/me succeeds with cookie
  AND frontend login proxy reaches API
```

```text
node_ops_ui_allowed =
  API-001 patched
  AND DATA-001 patched or computed-only formula approved
  AND authz/audit/redaction rules tested
```

---

## Entity/Data Diagram

```text
P10 fixture
  stock postgres:16
    -> current DATA-001 tables
  migrate
    -> Alembic head
  api
    -> users/auth_sessions
    -> health/auth endpoints
  frontend
    -> /api/v1 proxy

future operator surfaces
  Runtime Node / logs / usage / storage
    -> blocked until contracts define safe DTOs
```

---

## Junior Dev - Do This Order

1. Read F-009 acceptance and implementation log. Say "foundation only" in your implementation response.
2. Read F-010 spec/plan/tasks/test-plan/acceptance.
3. Diff old compose behavior into an implementation-log note.
4. Add stock `postgres:16` + migration fixture.
5. Add current API service and health/auth checks.
6. Add frontend production build/start service wired to API.
7. Add HTTP stack smoke.
8. Add placeholder-only runbook/env guidance.
9. Add safety/compose audit.
10. Record T-050 worker deferral.
11. Stop before Logs/Usage/Node/storage UI unless API-001 and DATA-001 are patched.

---

## Red Flags In PR

- Old `DATABASE_URL` appears where current env name is required.
- Old `app.main:create_app` appears in a current service.
- Redis, RQ, Celery, status poller, or deployment-control service appears without a current spec decision.
- Custom AGE/vector Postgres image appears before migration evidence requires it.
- Compose uses `next dev` as the canonical first-gate frontend service.
- Playwright is made mandatory for P10 AC-001 through AC-004.
- Committed examples contain a working password or provider credential.
- Frontend code learns database, Docker, runtime, storage, provider, or controller targets.
- A passing Postgres container is described as a passing stack.
- Logs/Usage/Node UI appears before contracts.
- P9 acceptance is marked implemented even though later slices are still blocked.

---

## Tests To Write

- Compose/deployment smoke: clean start -> stock Postgres healthy -> migrations head -> API live/ready -> production frontend login reachable.
- Auth smoke: admin login response has no token/password/hash, `/auth/me` succeeds with cookie.
- HTTP proxy smoke: frontend `/api/v1/auth/me` and `/api/v1/auth/login` reach API and do not fail connection.
- Safety scan: compose/env/runbook/smoke evidence has no working credentials, raw paths, runtime targets, stack traces, prompt/source/answer text, or raw payloads.
- Compose audit: no stale old services, old env names, or old API entrypoint.

Still needs ID-B only if P10 chooses to implement Runtime Node/logs/usage/storage contracts in the same phase. The runnable-stack foundation should not need it.

Next grill session: reconcile old compose deltas, then implement `T-010` through `T-040`.
