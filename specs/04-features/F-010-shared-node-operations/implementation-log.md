---
id: F-010
title: Shared Node Operations And Runnable Stack Implementation Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-10
depends_on: [F-010]
supersedes: []
---

# F-010 - Implementation Log

Status: runnable-stack gate implemented with workers-in-stack, hard-cut `stack` naming, and full pilot-path smoke. Contracted Runtime Node, Logs, Usage, storage, Docker environment UI/API surfaces remain deferred.

**Compound learning:** `docs/solutions/architecture-patterns/runnable-stack-postgres-lease-workers.md` — Postgres lease poll loop, shared compose volumes, HTTP-only stack smoke, and `stack` rename guidance for future agents.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-07-06 | Defined P10's first gate as a current-repo minimal runnable stack: Postgres, migrations, FastAPI on `8000`, and Next frontend on `3000`. | P9 frontend cannot be interactively used if the backend is not running, and P8 intentionally had no deployment compose fixture. | Implement T-010 through T-040 before richer node operations UI. |
| 2026-07-06 | Treat `.references/code/context-engine/docker-compose.yml` as evidence only, not a copy target. | The old compose uses stale module paths, env names, Redis, worker/status-poller services, deployment-control socket access, and API port defaults. | Record deltas again during implementation. |
| 2026-07-06 | Do not put a working admin password in specs or committed fixtures. | QA-002 forbids secrets in specs, fixtures, screenshots, logs, or public evidence. | Supply credentials locally through ignored env or secret handling. |
| 2026-07-06 | Resolved P10 first-gate deployment decisions: use one combined compose/local fixture, stock `postgres:16`, production Next build/start in compose, HTTP smoke only, and worker container deferral for the auth/proxy-only gate. | These choices proved the auth/proxy failure class with the least infrastructure drift. | Later superseded for workers by the 2026-07-10 runnable-stack workers slice. |
| 2026-07-06 | Added former `compose.p10.yml`, backend `Dockerfile`, `frontend/Dockerfile`, former `.env.p10.example`, former `scripts/p10_stack_smoke.py`, and former `scripts/p10_safety_scan.py`. | Provided the first current-repo runnable stack and repeatable safe evidence gate. | Hard-cut renamed to `stack` names on 2026-07-10. |
| 2026-07-06 | Patched `migrations/env.py` so explicit `CONTEXT_ENGINE_DATABASE_URL` wins over the fallback `alembic.ini` URL. | The first compose smoke showed Alembic was trying `localhost` from `alembic.ini` inside the container instead of the compose `postgres` service. | Keep config tests and smoke evidence tied to current env names. |
| 2026-07-06 | Deferred worker containers for the first auth/proxy-only runnable-stack proof. | Auth/proxy smoke needed Postgres, migrate, API, and frontend only. | Superseded 2026-07-10: workers-in-stack completed under T-050. |
| 2026-07-10 | Completed T-050 workers-in-stack: one compose `worker` service runs `python -m context_engine.worker` and round-robins prepare, index, and domain-delete `run_once` claims. Shared `stack-source-storage` and `stack-domain-runtimes` volumes mount on `api` and `worker`. | Upload/prepare/index/delete never completed without a process claiming leases; Redis/RQ/Celery remain rejected. | Keep single-worker pilot assumption; no replicas in this gate. |
| 2026-07-10 | Hard-cut renamed stack fixtures to `compose.stack.yml`, `.env.stack.example`, `.env.stack.local`, `scripts/stack_smoke.py`, `scripts/stack_safety_scan.py`, `STACK_API_PORT`, `STACK_FRONTEND_PORT`, volumes `stack-*`, project `context_engine_stack`. | Phase-coded `p10` names obscured that this is the canonical local stack. | Volume rename implies fresh DB unless operator migrates; old `.env.p10.local` is not read. |
| 2026-07-10 | Deepened stack smoke to full pilot path: upload → prepare → index → evidence → domain chat → delete → redaction. Smoke never calls `run_once` in-process. | Auth/proxy-only smoke left the product looking like a login shell rather than a RAG app. | Live Docker LightRAG remains a separate proof. |
| 2026-07-10 | Stack acceptance keeps `CE_DOMAIN_RUNTIME_CONTROLLER_KIND=local` and `CE_LIGHTRAG_CLIENT_KIND=local`. Production Settings default remains native (LD-006). | Deterministic Slice 0 gate without changing production defaults. | Optional live Docker LightRAG compose profile deferred. |
| 2026-07-10 | Safety scan allows the CE lease worker service name while still rejecting Redis, status-poller, deployment-control, Celery/RQ, and old entrypoints. | Former scan forbade any compose `worker:` service; that blocked the lease poller. | Keep job-platform bans. |

| 2026-07-10 | Documented runnable-stack workers pattern in `docs/solutions/architecture-patterns/runnable-stack-postgres-lease-workers.md` via `/ce-compound`. | Institutional memory for compose worker, shared volumes, stack smoke, and rename gotchas. | Cross-linked from this log; discoverability added to `AGENTS.md`. |

## Drift Register

| Date | Drift | Resolution | Evidence |
| --- | --- | --- | --- |
| 2026-07-06 | Alembic migration container ignored `CONTEXT_ENGINE_DATABASE_URL` because `migrations/env.py` preferred the non-placeholder `alembic.ini` URL. | `migrations/env.py` now prefers the explicit environment variable. | foundation auth tests and stack smoke passed. |
| 2026-07-10 | F-010 docs still recorded worker deferral and canonical `p10` entrypoints after workers-in-stack and rename shipped. | Specs, runbook, and traceability updated to workers-in-stack, `stack` names, and deepened smoke (U5). | this log; acceptance evidence; RUN-001 |

## Old Compose Delta Record

| Old reference item | Current P10 resolution |
| --- | --- |
| `app.main:create_app` | use `context_engine.app:create_app` |
| `DATABASE_URL` | use `CONTEXT_ENGINE_DATABASE_URL` |
| old API default `8010` | publish current API on `127.0.0.1:${STACK_API_PORT:-8000}` |
| custom AGE/vector Postgres image | use stock `postgres:16` for stack gate |
| Redis/RQ assumptions | rejected |
| old Redis/RQ `worker` service | rejected; replaced by CE lease worker `python -m context_engine.worker` |
| `status-poller` | rejected |
| `deployment-control` and Docker socket access | rejected |
| LightRAG runtime URL/container settings | remain private and absent from browser/API fixture surface; stack gate uses local LightRAG client kind |

## Verification Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `pytest tests/test_stack_worker_loop.py tests/test_stack_safety_scan.py tests/test_stack_smoke_helpers.py -q` | pass | 13 passed |
| `STACK_API_PORT=18000 STACK_FRONTEND_PORT=13000 .venv/bin/python scripts/stack_smoke.py --env-file .env.stack.local --project-name context_engine_stack_smoke --reset-state --write-evidence _tmp/stack-smoke.json` | pass | checks include postgres_health, alembic_head, api auth/proxy, worker_running, provider_config, domain_ready, source_upload, source_prepared_indexed (state=prepared; indexState=ready), evidence_retrieve, domain_chat (stopReason=grounded), source_delete_redaction (turnStatus=redacted), domain_delete |
| `python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json` | pass | ok; CE lease worker allowed; Redis/job-platform patterns rejected |

Historical 2026-07-06 auth/proxy-only evidence used former `compose.p10.yml` / `scripts/p10_*.py` names and is superseded by the commands above.

## Resolved Decisions

| Decision | Resolution | Notes |
| --- | --- | --- |
| OD-001 compose shape | One combined compose file `compose.stack.yml`. | Hard-cut rename from former `compose.p10.yml`. |
| OD-004 Postgres image/extensions | Stock `postgres:16`. | AGE/vector/custom image work is deferred until migrations, indexing, graph, or node contracts require it. |
| OD-002 frontend mode | Production build/start in compose. | `next dev` is optional local workflow only, not canonical stack evidence. |
| OD-003 workers | Exactly one CE lease worker in stack; T-050 deferral superseded. | No Redis/RQ/Celery/status-poller/deployment-control. |
| OD-005 rename | Canonical `stack` fixture/env/script/port/volume/project names only. | Volume rename = fresh DB unless operator migrates. |
| OD-006 client kinds | Local domain-runtime and LightRAG for this gate. | Production Settings default remains native (LD-006). |
| P10 browser proof | HTTP smoke for AC-001 through AC-004 and AC-008. | Playwright remains F-009 AC-007 unless later contracted P10 UI surfaces need it. |
