---
id: F-010
title: Shared Node Operations And Runnable Stack Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-10
depends_on: [F-010]
supersedes: []
---

# F-010 - Implementation Plan

## Build Strategy

Build the minimal runnable stack first, prove frontend-to-backend interaction, then deepen the stack with one CE lease worker and full pilot-path smoke. Richer node operations slices remain blocked until explicitly contracted.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| Deployment | Canonical fixture is `compose.stack.yml` (hard-cut rename from former `compose.p10.yml`): stock `postgres:16`, migrations, API, one CE lease worker, and frontend. Do not copy the old reference compose unchanged. |
| UI | P9 frontend runs in production build/start mode as part of the fixture and points at the API through `CONTEXT_ENGINE_API_BASE` or same-origin rewrites. `next dev` may be documented as an optional local path outside compose. Future Logs/Usage/Node UI remains blocked by contracts. |
| API/service | API service uses `context_engine.app:create_app`, current env names, and existing P1-P8 routes. No public API shape changes for the runnable foundation. |
| Data | Existing Alembic migrations run against stock `postgres:16`. No AGE/vector/custom image is required for the stack gate unless migration smoke proves otherwise. No new tables for the runnable foundation. Future node/usage/log surfaces require DATA-001 patches. Volume rename to `stack-*` implies a fresh local DB unless the operator migrates. |
| Worker/runtime | No Redis/RQ/Celery. Exactly one compose `worker` service runs `python -m context_engine.worker` and round-robins prepare/index/domain-delete `run_once` claims. Shared source-storage and domain-runtime volumes mount on `api` and `worker`. Stack acceptance uses local domain-runtime and LightRAG client kinds; production Settings default remains native (LD-006). |
| Security/privacy | Admin seed is env-driven; no committed working passwords or secret values. Browser never receives database, Docker, runtime, storage, provider, or controller targets. |
| Observability | Stack smoke records safe health/auth/pilot-path evidence only. Logs remain JSON/safe per QA-003. |

## Implementation Sequence

- [x] T-000 [docs] Reconcile old compose evidence with current contracts and record service/env deltas.
  - Verification: implementation log lists old `.references/code/context-engine/docker-compose.yml` deltas.
- [x] T-010 [deployment] Add current stock `postgres:16` + migration fixture in one combined compose/local fixture.
  - Verification: stack smoke reached `alembic_head` against stock `postgres:16` (historical first proof used former `p10` names; canonical command is now `scripts/stack_smoke.py`).
- [x] T-020 [deployment] Add current FastAPI service on `127.0.0.1:${STACK_API_PORT:-8000}`.
  - Verification: stack smoke passed `api_live`, `api_ready`, `api_admin_login`, and `api_auth_me`.
- [x] T-030 [deployment/frontend] Add frontend production build/start service wired to the API; document `next dev` only as optional local workflow outside compose.
  - Verification: production build passed; stack smoke passed `frontend_login_route`, `frontend_proxy_admin_login`, and `frontend_proxy_auth_me`.
- [x] T-040 [ops/test] Add an HTTP stack smoke command for the runnable app, deepened to the full pilot path.
  - Verification: `scripts/stack_smoke.py` proves DB, migration, API health, admin login, `/auth/me`, frontend proxy, worker running, upload → prepare → index → evidence → domain chat → delete → redaction without Playwright and without in-process `run_once`.
- [x] T-050 [backend] Complete workers-in-stack: one compose `worker` service running `python -m context_engine.worker` that claims prepare, index, and domain-delete leases. (Supersedes the earlier first-gate deferral.)
  - Verification: stack smoke passes `worker_running` and `source_prepared_indexed` / delete-redaction checks with the compose worker advancing state.
- [x] T-060 [docs] Update runbook with the stack launch path (`compose.stack.yml`, `.env.stack.*`, `STACK_*_PORT`, project `context_engine_stack`), volume rename caveat, local-fake note, stop/cleanup behavior, and known limits.
  - Verification: runbook uses placeholders only and names required env vars without values; no canonical `p10` entrypoints remain as current instructions.
- [x] T-070 [security] Add safety scan coverage for compose/env examples and smoke evidence; allow CE lease worker while rejecting Redis/RQ/Celery/status-poller/deployment-control.
  - Verification: `python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json` passed.
- [ ] T-100 [contracts] Capture API-001/DATA-001 contracts for Runtime Node, Node Environment, logs, usage, and storage summaries before any UI surfaces.
  - Verification: contract patch review.
- [ ] T-110 [frontend] Implement contracted Logs/Usage/Node surfaces with Local Studio visual parity.
  - Verification: admin/member authz tests, import/network audit, screenshots.

## Runnable Stack Shape

```text
Browser
  -> Next frontend on 127.0.0.1:${STACK_FRONTEND_PORT:-3000}
  -> FastAPI on 127.0.0.1:${STACK_API_PORT:-8000}
  -> stock postgres:16 service
  -> worker (python -m context_engine.worker) claims leases
```

Required service responsibilities:

| Service | Required behavior |
| --- | --- |
| `postgres` | stock `postgres:16`; stores current Context Engine schema; healthcheck gates migration |
| `migrate` | runs Alembic to head using `CONTEXT_ENGINE_DATABASE_URL` |
| `api` | starts `context_engine.app:create_app`, seeds Administrator from env, exposes API and health; shares source-storage and domain-runtime volumes with worker |
| `worker` | runs `python -m context_engine.worker`; round-robins prepare, index, and domain-delete `run_once` claims; same DB URL and local client kinds as API; shares storage/runtime volumes |
| `frontend` | runs production build/start for the P9 frontend and routes `/api/v1/*` and `/health/*` to API |

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
STACK_API_PORT
STACK_FRONTEND_PORT
```

Rules:

- Specs, examples, screenshots, and committed config must not contain working credential values.
- Local ignored env files (`.env.stack.local`) may supply developer values. Former `.env.p10.local` is not read.
- Compose must align API port with the P9 frontend proxy default or explicitly set `CONTEXT_ENGINE_API_BASE`.
- Use stock `postgres:16` for the stack gate. If migration smoke proves an extension/image dependency, document and test the change before continuing.
- The canonical compose fixture runs the production frontend. `next dev` is a local developer convenience only.
- Stack fixture sets local domain-runtime and LightRAG client kinds for this gate; production Settings default remains native (LD-006).
- Hard-cut volume rename to `stack-postgres-data` / `stack-source-storage` / `stack-domain-runtimes` implies a fresh local database unless the operator manually migrates data.

## Migration And Rollback

- Schema change for runnable foundation: none.
- Migration order: Postgres healthy -> Alembic head -> API startup + worker startup -> frontend startup.
- Rollback: stop services, preserve or remove local volumes according to runbook; destructive volume cleanup must be explicit.
- Future P10 node/usage/log contracts may require additive migrations and rollback notes.

## Risks

- Old compose drift: old env names and entrypoints fail against the current repo.
- False readiness: Postgres running without API/frontend/worker pilot-path smoke does not satisfy P10.
- Secret leakage: example env values become accidental real credentials.
- Overbuild: Redis/status-poller/deployment-control services sneak in without current contracts.
- Hidden DB extension dependency: clean migration against stock Postgres is the proof; revise only if it fails.
- Frontend mode drift: dev server behavior is not acceptance evidence for P10.
- Browser boundary drift: node/Runtime/Docker controls expose raw targets instead of backend-authorized IDs.
- Volume rename: developers lose local DB state unless they migrate; call out in runbook.

## Deferred Work

- Full production deployment hardening is not required for the stack gate.
- Live Docker LightRAG / native runtime in compose acceptance (local fakes for this gate; LD-006 production default unchanged).
- Runtime Node, Logs, Usage, storage summaries, and Docker environment UI/API work remains blocked until API-001 and DATA-001 are patched.
- Playwright is deferred to F-009 AC-007 unless later contracted P10 UI surfaces require it.
- AGE/vector/custom Postgres image work is deferred until migrations, indexing, graph, or node contracts require it.
- Multiple worker replicas or per-kind worker services.
- Logs/Usage/Node UI surfaces wait for API-001 and DATA-001 contract patches.
- Wiki and Smart Composer remain F-011.
