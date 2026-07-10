---
id: F-010
title: Shared Node Operations And Runnable Stack Acceptance Evidence
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-10
depends_on: [F-010]
supersedes: []
---

# F-010 - Acceptance Evidence

Status: runnable-stack gate implemented with workers-in-stack and hard-cut `stack` naming. Full pilot-path HTTP smoke is the acceptance gate. Runtime Node, Logs, Usage, storage, Docker environment UI/API surfaces remain contract-blocked until API-001 and DATA-001 are patched.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `compose.stack.yml`; stack smoke with `--reset-state` | pass | smoke passed `postgres_health`, `alembic_head`, and `worker_healthy` (heartbeat healthcheck); stock `postgres:16`; services include postgres, migrate, api, worker, frontend |
| AC-002 | stack smoke safe evidence `_tmp/stack-smoke.json` | pass | API and frontend reachable; ports may be overridden via `STACK_API_PORT` / `STACK_FRONTEND_PORT` (evidence run used `18000` / `13000` due to host conflict) |
| AC-003 | stack smoke safe evidence `_tmp/stack-smoke.json` | pass | `api_admin_login` and `api_auth_me` returned success; auth response safety checked for no token/password/hash keys |
| AC-004 | stack smoke safe evidence `_tmp/stack-smoke.json` | pass | frontend proxy admin login and auth/me succeeded; no `ECONNREFUSED`; Playwright remains F-009 AC-007 |
| AC-005 | `python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json` | pass | scan covers compose, env example, Dockerfiles, runbook, F-010 docs, traceability, scripts, and safe smoke evidence |
| AC-006 | `compose.stack.yml`; `python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json` | pass | no Redis/RQ/Celery, status-poller, or deployment-control; exactly one CE lease worker (`python -m context_engine.worker`) is present and allowed |
| AC-007 | F-010 docs and implementation log review | pass | Logs/Usage/Node/storage UI/API work remains blocked until API-001 and DATA-001 are patched |
| AC-008 | stack smoke safe evidence `_tmp/stack-smoke.json` | pass | full path: `provider_config`, `domain_ready`, `source_upload`, `source_prepared_indexed` (`state=prepared`; `indexState=ready`), `evidence_retrieve`, `domain_chat` (`stopReason=grounded`), `source_delete_redaction` (`turnStatus=redacted`), `domain_delete`; compose worker advanced state; no in-process `run_once` in smoke |

## Completion Rule

F-010 stack gate is implemented because the stack was started from an explicit reset state, one CE lease worker advanced prepare/index/delete work, and a real frontend-to-API auth plus full pilot path was proven by HTTP smoke against listening services.

## Verification Commands

```text
docker compose --env-file .env.stack.local -f compose.stack.yml config --quiet
pytest tests/test_stack_worker_loop.py tests/test_stack_safety_scan.py tests/test_stack_smoke_helpers.py tests/test_stack_smoke_imports.py tests/test_stack_smoke_worker_negative.py -q -m "not integration_docker"
STACK_API_PORT=18000 STACK_FRONTEND_PORT=13000 .venv/bin/python scripts/stack_smoke.py --env-file .env.stack.local --project-name context_engine_stack_smoke --reset-state --write-evidence _tmp/stack-smoke.json
python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json
```

Default ports (`STACK_API_PORT=8000`, `STACK_FRONTEND_PORT=3000`) and project `context_engine_stack` are the canonical operator defaults when the host is free. The evidence run above overrode ports and used project `context_engine_stack_smoke` due to host conflict.

Notes:

- `.env.stack.local` used local throwaway values and is ignored.
- `_tmp/stack-smoke.json` is safe local evidence and is ignored.
- Unit: `pytest tests/test_stack_worker_loop.py tests/test_stack_safety_scan.py tests/test_stack_smoke_helpers.py tests/test_stack_smoke_imports.py tests/test_stack_smoke_worker_negative.py -m "not integration_docker"` → hardening + AST + safe negative notes.
- Optional Docker negative proofs: `pytest tests/test_stack_smoke_worker_negative.py -m integration_docker` (absent worker); set `CE_RUN_STACK_NEGATIVE_MID_PILOT=1` for mid-pilot stop.
- Safety scan → ok; pins `python -m context_engine.worker`.
- Stack fixture uses local domain-runtime and LightRAG client kinds for this gate; production Settings default remains native (LD-006).
- Hard-cut volume rename to `stack-*` implies a fresh local database unless the operator migrates former `p10` volumes.
- Slice 1 hardening (2026-07-10): worker heartbeat healthcheck, safety-scan command pin, AST import guard, dual negative proofs.
## Decision Lock

- Compose shape: one combined fixture `compose.stack.yml` (hard-cut rename from former `compose.p10.yml`).
- Postgres: stock `postgres:16`; AGE/vector/custom image deferred until evidence requires it.
- Frontend: production build/start in compose; `next dev` optional outside compose.
- Workers: exactly one CE lease worker in stack; Redis/RQ/Celery/status-poller/deployment-control forbidden. Earlier T-050 deferral is superseded.
- Browser proof: HTTP smoke for AC-001 through AC-004 and AC-008; Playwright remains F-009 AC-007 unless later P10 UI surfaces require it.
- Client kinds: local for this gate; native production default unchanged (LD-006).
