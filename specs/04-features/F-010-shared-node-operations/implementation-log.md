---
id: F-010
title: Shared Node Operations And Runnable Stack Implementation Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-010]
supersedes: []
---

# F-010 - Implementation Log

Status: first runnable-stack gate implemented. Contracted Runtime Node, Logs, Usage, storage, Docker environment UI/API surfaces remain deferred.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-07-06 | Defined P10's first gate as a current-repo minimal runnable stack: Postgres, migrations, FastAPI on `8000`, and Next frontend on `3000`. | P9 frontend cannot be interactively used if the backend is not running, and P8 intentionally had no deployment compose fixture. | Implement T-010 through T-040 before richer node operations UI. |
| 2026-07-06 | Treat `.references/code/context-engine/docker-compose.yml` as evidence only, not a copy target. | The old compose uses stale module paths, env names, Redis, worker/status-poller services, deployment-control socket access, and API port defaults. | Record deltas again during implementation. |
| 2026-07-06 | Do not put a working admin password in specs or committed fixtures. | QA-002 forbids secrets in specs, fixtures, screenshots, logs, or public evidence. | Supply credentials locally through ignored env or secret handling. |
| 2026-07-06 | Resolved P10 first-gate deployment decisions: use one combined compose/local fixture, stock `postgres:16`, production Next build/start in compose, HTTP smoke only, and worker container deferral. | These choices prove the actual auth/proxy failure class with the least infrastructure drift and keep Playwright, workers, AGE/vector images, and operator UI out of the first gate. | Implement T-010 through T-040 from these decisions; record T-050 worker deferral unless a later current-entrypoint proof changes it. |
| 2026-07-06 | Added `compose.p10.yml`, backend `Dockerfile`, `frontend/Dockerfile`, `.env.p10.example`, `scripts/p10_stack_smoke.py`, and `scripts/p10_safety_scan.py`. | Provides the current-repo runnable stack and repeatable safe evidence gate required by P10. | Keep `.env.p10.local` and `_tmp` evidence ignored; do not commit working secret values. |
| 2026-07-06 | Patched `migrations/env.py` so explicit `CONTEXT_ENGINE_DATABASE_URL` wins over the fallback `alembic.ini` URL. | The first compose smoke showed Alembic was trying `localhost` from `alembic.ini` inside the container instead of the compose `postgres` service. | Keep config tests and smoke evidence tied to current env names. |
| 2026-07-06 | Deferred worker containers for the first runnable-stack proof. | Auth/proxy smoke needs Postgres, migrate, API, and frontend only; source prep/index/delete worker proof remains outside this gate. | Add only current worker entrypoints after tests and acceptance require them. |

## Drift Register

| Date | Drift | Resolution | Evidence |
| --- | --- | --- | --- |
| 2026-07-06 | Alembic migration container ignored `CONTEXT_ENGINE_DATABASE_URL` because `migrations/env.py` preferred the non-placeholder `alembic.ini` URL. | `migrations/env.py` now prefers the explicit environment variable. | `pytest tests/test_foundation_auth.py -q` and P10 stack smoke passed. |

## Old Compose Delta Record

| Old reference item | Current P10 resolution |
| --- | --- |
| `app.main:create_app` | use `context_engine.app:create_app` |
| `DATABASE_URL` | use `CONTEXT_ENGINE_DATABASE_URL` |
| old API default `8010` | publish current API on `127.0.0.1:8000` |
| custom AGE/vector Postgres image | use stock `postgres:16` for first gate |
| Redis/RQ assumptions | rejected for first gate |
| `worker` service | deferred for first gate |
| `status-poller` | rejected for first gate |
| `deployment-control` and Docker socket access | rejected for first gate |
| LightRAG runtime URL/container settings | remain private and absent from browser/API fixture surface |

## Verification Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `docker compose -f compose.p10.yml config --quiet` | pass | compose rendered successfully; sandbox emitted Docker config access warnings |
| `npm.cmd run test:foundation` | pass | F-009 foundation tests stayed green |
| `npm.cmd run typecheck` | pass | frontend TypeScript passed |
| `npm.cmd run build` | pass | production Next build passed |
| `.\.venv\Scripts\python.exe -m py_compile scripts\p10_stack_smoke.py scripts\p10_safety_scan.py migrations\env.py` | pass | script syntax passed |
| `.\.venv\Scripts\python.exe -m pytest tests\test_foundation_auth.py -q` | pass | `8 passed`; one existing Starlette/httpx deprecation warning |
| `.\.venv\Scripts\python.exe scripts\p10_stack_smoke.py --env-file _tmp\p10-smoke.env --project-name context_engine_p10_codex --reset-state --write-evidence _tmp\p10-stack-smoke.json` | pass | Postgres, Alembic, API, auth, frontend route, and frontend proxy checks passed |
| `.\.venv\Scripts\python.exe scripts\p10_safety_scan.py --smoke-evidence _tmp\p10-stack-smoke.json` | pass | compose/env/runbook/docs/scripts/smoke evidence scan passed |

## Resolved First-Gate Decisions

| Decision | Resolution | Notes |
| --- | --- | --- |
| OD-001 compose shape | One combined compose file or clearly named local fixture. | Split dev/pilot fixtures only after AC-001 through AC-004 prove a real divergence. |
| OD-004 Postgres image/extensions | Stock `postgres:16`. | AGE/vector/custom image work is deferred until migrations, indexing, graph, or node contracts require it. |
| OD-002 frontend mode | Production build/start in compose. | `next dev` is optional local workflow only, not canonical P10 evidence. |
| OD-003 workers | Defer worker containers for T-010 through T-040; record deferral at T-050. | Background upload/index/delete workflows remain outside first runnable-stack proof. |
| P10 browser proof | HTTP smoke only for AC-001 through AC-004. | Playwright remains F-009 AC-007 unless later contracted P10 UI surfaces need it. |
