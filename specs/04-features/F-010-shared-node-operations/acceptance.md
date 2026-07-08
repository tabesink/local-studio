---
id: F-010
title: Shared Node Operations And Runnable Stack Acceptance Evidence
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-010]
supersedes: []
---

# F-010 - Acceptance Evidence

Status: first runnable-stack gate implemented. Runtime Node, Logs, Usage, storage, Docker environment UI/API surfaces remain contract-blocked until API-001 and DATA-001 are patched.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `compose.p10.yml`; `python scripts/p10_stack_smoke.py --env-file _tmp/p10-smoke.env --project-name context_engine_p10_codex --reset-state --write-evidence _tmp/p10-stack-smoke.json` | pass | smoke passed `postgres_health` and `alembic_head`; stock `postgres:16` was used |
| AC-002 | P10 stack smoke safe evidence `_tmp/p10-stack-smoke.json` | pass | API `http://127.0.0.1:8000` returned `200` for `api_live` and `api_ready`; frontend `http://127.0.0.1:3000/login` returned `200` |
| AC-003 | P10 stack smoke safe evidence `_tmp/p10-stack-smoke.json` | pass | `api_admin_login` and `api_auth_me` returned `200`; auth response safety checked for no token/password/hash keys |
| AC-004 | P10 stack smoke safe evidence `_tmp/p10-stack-smoke.json` | pass | `frontend_proxy_admin_login` and `frontend_proxy_auth_me` returned `200`; no `ECONNREFUSED`; Playwright remains F-009 AC-007 |
| AC-005 | `python scripts/p10_safety_scan.py --smoke-evidence _tmp/p10-stack-smoke.json` | pass | scan covers compose, env example, Dockerfiles, runbook, F-010 docs, traceability, scripts, and safe smoke evidence |
| AC-006 | `compose.p10.yml`; `python scripts/p10_safety_scan.py --smoke-evidence _tmp/p10-stack-smoke.json` | pass | first gate has no Redis/RQ/Celery, worker, status-poller, deployment-control, old custom Postgres image, or old app entrypoint |
| AC-007 | F-010 docs and implementation log review | pass | Logs/Usage/Node/storage UI/API work remains blocked until API-001 and DATA-001 are patched |

## Completion Rule

F-010 foundation is implemented because the stack was started from an explicit reset state and a real frontend-to-API auth flow was proven by HTTP smoke against listening services.

## Verification Commands

```text
docker compose -f compose.p10.yml config --quiet
npm.cmd run test:foundation
npm.cmd run typecheck
npm.cmd run build
.\.venv\Scripts\python.exe -m py_compile scripts\p10_stack_smoke.py scripts\p10_safety_scan.py migrations\env.py
.\.venv\Scripts\python.exe -m pytest tests\test_foundation_auth.py -q
.\.venv\Scripts\python.exe scripts\p10_stack_smoke.py --env-file _tmp\p10-smoke.env --project-name context_engine_p10_codex --reset-state --write-evidence _tmp\p10-stack-smoke.json
.\.venv\Scripts\python.exe scripts\p10_safety_scan.py --smoke-evidence _tmp\p10-stack-smoke.json
```

Notes:

- `_tmp/p10-smoke.env` used local throwaway values and is ignored.
- `_tmp/p10-stack-smoke.json` is safe local evidence and is ignored.
- `docker compose -f compose.p10.yml config --quiet` exited successfully with sandbox warnings about Docker config file access; the compose render itself passed.

## First-Gate Decision Lock

- Compose shape: one combined compose file or clearly named local fixture.
- Postgres: stock `postgres:16`; AGE/vector/custom image deferred until evidence requires it.
- Frontend: production build/start in compose; `next dev` optional outside compose.
- Workers: deferred for T-010 through T-040; T-050 records deferral.
- Browser proof: HTTP smoke for P10 AC-001 through AC-004; Playwright remains F-009 AC-007 unless later P10 UI surfaces require it.
