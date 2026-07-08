---
id: F-010
title: Shared Node Operations And Runnable Stack Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-010]
supersedes: []
---

# F-010 - Implementation Plan

## Build Strategy

Build the minimal runnable stack first, prove frontend-to-backend interaction, then stop or proceed to explicitly contracted node operations slices. The first P10 gate is not a dashboard; it is a current deployment fixture that makes the P9 frontend usable against the P1-P8 backend.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| Deployment | Add one combined current-repo Docker/compose fixture for stock `postgres:16`, migrations, API, and frontend. Do not copy the old reference compose unchanged. |
| UI | P9 frontend runs in production build/start mode as part of the fixture and points at the API through `CONTEXT_ENGINE_API_BASE` or same-origin rewrites. `next dev` may be documented as an optional local path outside compose. Future Logs/Usage/Node UI remains blocked by contracts. |
| API/service | API service uses `context_engine.app:create_app`, current env names, and existing P1-P8 routes. No public API shape changes for the runnable foundation. |
| Data | Existing Alembic migrations run against stock `postgres:16`. No AGE/vector/custom image is required for the first gate unless migration smoke proves otherwise. No new tables for the runnable foundation. Future node/usage/log surfaces require DATA-001 patches. |
| Worker/runtime | No Redis/RQ/Celery. Worker containers are deferred for T-010 through T-040 and T-050 records the deferral unless current entrypoints and acceptance require a worker later. Docker/runtime targets stay backend-owned. |
| Security/privacy | Admin seed is env-driven; no committed working passwords or secret values. Browser never receives database, Docker, runtime, storage, provider, or controller targets. |
| Observability | Stack smoke records safe health/auth evidence only. Logs remain JSON/safe per QA-003. |

## Implementation Sequence

- [x] T-000 [docs] Reconcile old compose evidence with current contracts and record service/env deltas.
  - Verification: implementation log lists old `.references/code/context-engine/docker-compose.yml` deltas.
- [x] T-010 [deployment] Add current stock `postgres:16` + migration fixture in one combined compose/local fixture.
  - Verification: `python scripts/p10_stack_smoke.py --env-file _tmp/p10-smoke.env --project-name context_engine_p10_codex --reset-state --write-evidence _tmp/p10-stack-smoke.json` reached `alembic_head` against stock `postgres:16`.
- [x] T-020 [deployment] Add current FastAPI service on `127.0.0.1:8000`.
  - Verification: P10 stack smoke passed `api_live`, `api_ready`, `api_admin_login`, and `api_auth_me`.
- [x] T-030 [deployment/frontend] Add frontend production build/start service wired to the API; document `next dev` only as optional local workflow outside compose.
  - Verification: `npm.cmd run build` passed; P10 stack smoke passed `frontend_login_route`, `frontend_proxy_admin_login`, and `frontend_proxy_auth_me`.
- [x] T-040 [ops/test] Add an HTTP stack smoke command for the minimal runnable app.
  - Verification: `scripts/p10_stack_smoke.py` proves DB, migration, API health, admin login, `/auth/me`, frontend `/login`, and frontend proxy alignment without Playwright.
- [x] T-050 [backend] Record worker container deferral for the first runnable-stack gate.
  - Verification: implementation log states no worker process is needed for P10 auth/proxy smoke and background workflows remain outside first runnable-stack proof.
- [x] T-060 [docs] Update runbook with the P10 launch path, env names, stop/cleanup behavior, and known limits.
  - Verification: runbook uses placeholders only and names required env vars without values.
- [x] T-070 [security] Add safety scan coverage for compose/env examples and smoke evidence.
  - Verification: `python scripts/p10_safety_scan.py --smoke-evidence _tmp/p10-stack-smoke.json` passed.
- [ ] T-100 [contracts] Capture API-001/DATA-001 contracts for Runtime Node, Node Environment, logs, usage, and storage summaries before any UI surfaces.
  - Verification: contract patch review.
- [ ] T-110 [frontend] Implement contracted Logs/Usage/Node surfaces with Local Studio visual parity.
  - Verification: admin/member authz tests, import/network audit, screenshots.

## Runnable Stack Shape

```text
Browser
  -> Next frontend on 127.0.0.1:3000
  -> FastAPI on 127.0.0.1:8000
  -> stock postgres:16 service
```

Required service responsibilities:

| Service | Required behavior |
| --- | --- |
| `postgres` | stock `postgres:16`; stores current Context Engine schema; healthcheck gates migration |
| `migrate` | runs Alembic to head using `CONTEXT_ENGINE_DATABASE_URL` |
| `api` | starts `context_engine.app:create_app`, seeds Administrator from env, exposes API and health |
| `frontend` | runs production build/start for the P9 frontend and routes `/api/v1/*` and `/health/*` to API |

Optional later service:

| Service | Gate |
| --- | --- |
| `worker` | deferred for T-010 through T-040; add only after current repo worker loop entrypoints exist, tests prove source prep/index/delete behavior through Postgres leases, and acceptance requires it |

## Deployment Configuration

Required env/secret names:

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
CONTEXT_ENGINE_DATABASE_URL
CE_ADMIN_USERNAME
CE_ADMIN_PASSWORD
CE_SESSION_COOKIE_SECURE
CONFIG_ENCRYPTION_KEY
CONTEXT_ENGINE_API_BASE
```

Rules:

- Specs, examples, screenshots, and committed config must not contain working credential values.
- Local ignored env files may supply developer values.
- Compose must align API port with the P9 frontend proxy default or explicitly set `CONTEXT_ENGINE_API_BASE`.
- Use stock `postgres:16` for the first gate. If migration smoke proves an extension/image dependency, document and test the change before continuing.
- The canonical compose fixture runs the production frontend. `next dev` is a local developer convenience only.

## Migration And Rollback

- Schema change for runnable foundation: none.
- Migration order: Postgres healthy -> Alembic head -> API startup -> frontend startup.
- Rollback: stop services, preserve or remove local volumes according to runbook; destructive volume cleanup must be explicit.
- Future P10 node/usage/log contracts may require additive migrations and rollback notes.

## Risks

- Old compose drift: old env names and entrypoints fail against the current repo.
- False readiness: Postgres running without API/frontend smoke does not satisfy P10.
- Secret leakage: example env values become accidental real credentials.
- Overbuild: old Redis/status-poller/deployment-control services sneak in without current contracts.
- Hidden DB extension dependency: clean migration against stock Postgres is the proof; revise only if it fails.
- Frontend mode drift: dev server behavior is not acceptance evidence for P10.
- Browser boundary drift: node/Runtime/Docker controls expose raw targets instead of backend-authorized IDs.

## Deferred Work

- Full production deployment hardening is not required for the first P10 runnable stack.
- Worker containers are deferred for the first P10 auth/proxy smoke.
- Runtime Node, Logs, Usage, storage summaries, and Docker environment UI/API work remains blocked until API-001 and DATA-001 are patched.
- Playwright is deferred to F-009 AC-007 unless later contracted P10 UI surfaces require it.
- AGE/vector/custom Postgres image work is deferred until migrations, indexing, graph, or node contracts require it.
- Logs/Usage/Node UI surfaces wait for API-001 and DATA-001 contract patches.
- Wiki and Smart Composer remain F-011.
