---
id: F-010
title: Shared Node Operations And Runnable Stack Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-10
depends_on: [F-010]
supersedes: []
---

# F-010 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | current-repo `compose.stack.yml` starts stock Postgres, migrations, API, CE lease worker, and production frontend |
| AC-002 | automated or explicit manual | API on `127.0.0.1:${STACK_API_PORT:-8000}`; frontend on `127.0.0.1:${STACK_FRONTEND_PORT:-3000}` |
| AC-003 | automated | environment-seeded Administrator can login and `/api/v1/auth/me` returns safe user DTO |
| AC-004 | automated HTTP smoke | frontend login route proxies `/api/v1/auth/me` and `/api/v1/auth/login` without `ECONNREFUSED` |
| AC-005 | automated | safety scan over compose/env/runbook/smoke evidence |
| AC-006 | automated or review | compose audit confirms no Redis/RQ/Celery/status-poller/deployment-control; exactly one CE lease worker (`python -m context_engine.worker`) is present and allowed |
| AC-007 | review | node/logs/usage/storage surfaces remain blocked until API/data contracts exist |
| AC-008 | automated HTTP smoke | full pilot path: upload → prepare → index → evidence → domain-grounded chat → delete → redaction with compose worker advancing state (no in-process `run_once`) |

## Stack Smoke Requirements

The stack smoke must run against actual listening services, not only in-process test clients. Canonical command:

```text
python scripts/stack_smoke.py --env-file .env.stack.local --project-name context_engine_stack --reset-state --write-evidence _tmp/stack-smoke.json
```

Required checks:

- Postgres health succeeds.
- Alembic migration reaches head from an empty volume/database.
- `GET /health/live` succeeds through the API service.
- `GET /health/ready` succeeds through the API service.
- Compose `worker` service is healthy via heartbeat file under `CE_DOMAIN_RUNTIME_ROOT` (not Status==running alone).
- `POST /api/v1/auth/login` succeeds for the environment-seeded Administrator.
- Login response contains no token/password/hash.
- `GET /api/v1/auth/me` succeeds using the HttpOnly cookie.
- Frontend `/login` loads.
- Frontend proxy path for `/api/v1/auth/me` reaches the API service instead of failing connection.
- Frontend proxy path for `/api/v1/auth/login` reaches the API service instead of failing connection.
- Provider config and domain ready succeed.
- Source upload succeeds; smoke polls until `state=prepared` and `indexState=ready` with the compose worker advancing state (no in-process `run_once`).
- Evidence retrieve succeeds.
- One domain-grounded chat turn completes with a safe terminal (for example `stopReason=grounded`).
- Source delete and redaction succeed (for example `turnStatus=redacted`); domain delete completes.
- Smoke evidence JSON contains only safe ids/statuses (no secrets, source text, prompts, answers, runtime URLs, paths, or provider payloads).

Safety scan:

```text
python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json
```

Unit coverage for worker loop, safety scan, smoke helpers, AST guard, and negative notes:

```text
pytest tests/test_stack_worker_loop.py tests/test_stack_safety_scan.py tests/test_stack_smoke_helpers.py tests/test_stack_smoke_imports.py tests/test_stack_smoke_worker_negative.py -m "not integration_docker"
```

Optional Docker-marked negative proofs (skip without Docker / `.env.stack.local`):

```text
pytest tests/test_stack_smoke_worker_negative.py -m integration_docker
CE_RUN_STACK_NEGATIVE_MID_PILOT=1 pytest tests/test_stack_smoke_worker_negative.py -m integration_docker -k mid_pilot
```

The stack proof is HTTP smoke only. Playwright remains owned by F-009 AC-007 unless P10 later implements contracted operator UI surfaces. In-process `scripts/pilot_flow.py` / `scripts/compose_smoke.py` remain for non-Docker CI; they are not the F-010 stack acceptance gate.

## Contract And Compatibility Checks

| Contract/spec | Provider/consumer | Scenario | Evidence |
| --- | --- | --- | --- |
| API-001 | API/frontend | auth and health paths match P9 proxy expectations; pilot path uses approved admin/member routes | stack smoke |
| DATA-001 | migration/API | current schema migrates cleanly on Postgres | migration log/test |
| QA-002 | deployment/API/frontend | secrets and tokens are not committed, returned, logged, or stored in browser | safety scan |
| QA-003 | API/deployment | logs contain safe metadata only | log scan/review |
| ARCH-002 | frontend/deployment | browser does not receive raw Docker/database/runtime/storage targets | import/network audit |
| LD-006 | stack fixture | stack acceptance uses local domain-runtime and LightRAG client kinds; production Settings default remains native | compose review |

## Security And Privacy Checks

- [ ] No working password in committed compose, env examples, specs, screenshots, logs, or acceptance evidence.
- [ ] Login response contains no token.
- [ ] Browser storage contains no token.
- [ ] API errors remain safe and bland.
- [ ] Compose does not expose database credentials to browser runtime.
- [ ] No raw Docker socket, runtime URL, storage path, provider payload, prompt, answer, source text, evidence excerpt, stack trace, or host path in public UI/API/log evidence.
- [ ] Stock `postgres:16` migration reaches head; AGE/vector/custom image work remains deferred unless migration proof fails.
- [ ] Compose has no Redis/RQ/Celery/status-poller/deployment-control; exactly one CE lease worker is present and allowed.
- [ ] Smoke evidence artifact contains only safe ids/statuses.

## Visual Checks

Only required when P10 UI surfaces are implemented. They are not required for the HTTP runnable-stack gate:

- `1440x900` dark;
- `1440x900` light;
- `1280x800` dark;
- narrow viewport;
- Local Studio visual parity for tables, settings rows, logs, status, and right detail panels.

## Exit Criteria

F-010 stack gate is complete only when the full pilot-path stack smoke passes from a clean start with the compose worker advancing state, frontend/backend interaction is proven, safety scans pass, acceptance evidence is updated, and traceability names F-010 as the current deployment fixture owner with workers-in-stack and `stack` naming.
