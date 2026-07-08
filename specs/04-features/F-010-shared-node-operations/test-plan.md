---
id: F-010
title: Shared Node Operations And Runnable Stack Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-010]
supersedes: []
---

# F-010 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | current-repo compose/deployment fixture starts stock Postgres, migrations, API, and production frontend |
| AC-002 | automated or explicit manual | API on `127.0.0.1:8000`; frontend on `127.0.0.1:3000` |
| AC-003 | automated | environment-seeded Administrator can login and `/api/v1/auth/me` returns safe user DTO |
| AC-004 | automated HTTP smoke | frontend login route proxies `/api/v1/auth/me` and `/api/v1/auth/login` without `ECONNREFUSED` |
| AC-005 | automated | safety scan over compose/env/runbook/smoke evidence |
| AC-006 | automated or review | compose audit confirms no stale old services or Redis/RQ/Celery |
| AC-007 | review | node/logs/usage/storage surfaces remain blocked until API/data contracts exist |

## Stack Smoke Requirements

The P10 smoke must run against actual listening services, not only in-process test clients.

Required checks:

- Postgres health succeeds.
- Alembic migration reaches head from an empty volume/database.
- `GET /health/live` succeeds through the API service.
- `GET /health/ready` succeeds through the API service.
- `POST /api/v1/auth/login` succeeds for the environment-seeded Administrator.
- Login response contains no token/password/hash.
- `GET /api/v1/auth/me` succeeds using the HttpOnly cookie.
- Frontend `/login` loads.
- Frontend proxy path for `/api/v1/auth/me` reaches the API service instead of failing connection.
- Frontend proxy path for `/api/v1/auth/login` reaches the API service instead of failing connection.

The first P10 runnable-stack proof is HTTP smoke only. Playwright remains owned by F-009 AC-007 unless P10 later implements contracted operator UI surfaces.

## Contract And Compatibility Checks

| Contract/spec | Provider/consumer | Scenario | Evidence |
| --- | --- | --- | --- |
| API-001 | API/frontend | auth and health paths match P9 proxy expectations | stack smoke |
| DATA-001 | migration/API | current schema migrates cleanly on Postgres | migration log/test |
| QA-002 | deployment/API/frontend | secrets and tokens are not committed, returned, logged, or stored in browser | safety scan |
| QA-003 | API/deployment | logs contain safe metadata only | log scan/review |
| ARCH-002 | frontend/deployment | browser does not receive raw Docker/database/runtime/storage targets | import/network audit |

## Security And Privacy Checks

- [ ] No working password in committed compose, env examples, specs, screenshots, logs, or acceptance evidence.
- [ ] Login response contains no token.
- [ ] Browser storage contains no token.
- [ ] API errors remain safe and bland.
- [ ] Compose does not expose database credentials to browser runtime.
- [ ] No raw Docker socket, runtime URL, storage path, provider payload, prompt, answer, source text, evidence excerpt, stack trace, or host path in public UI/API/log evidence.
- [ ] Stock `postgres:16` migration reaches head; AGE/vector/custom image work remains deferred unless migration proof fails.
- [ ] Worker container is absent from the first-gate fixture or explicitly deferred in implementation evidence.

## Visual Checks

Only required when P10 UI surfaces are implemented. They are not required for the first HTTP runnable-stack gate:

- `1440x900` dark;
- `1440x900` light;
- `1280x800` dark;
- narrow viewport;
- Local Studio visual parity for tables, settings rows, logs, status, and right detail panels.

## Exit Criteria

P10 foundation is complete only when the stack smoke passes from a clean start, frontend/backend interaction is proven, safety scans pass, acceptance evidence is updated, and traceability names P10 as the current deployment fixture owner.
