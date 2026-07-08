---
id: RUN-001
title: Pilot Launch Runbook
status: approved
owner: Context Engine operations team
last_reviewed: 2026-07-06
depends_on: [DEL-002, QA-003]
supersedes: []
---

# Pilot Launch Runbook

Before a 5-10 user internal pilot:

1. Confirm P1-P8 acceptance evidence is complete.
2. Run fresh database migration from empty.
3. Run the P8 local compose-replacement smoke and private runtime health checks.
4. Run full e2e flow: auth, domain, upload, prepare, index, evidence, chat, delete, redaction.
5. Confirm browser storage has no auth token.
6. Confirm audit events and safe JSON logs are emitted for admin/security actions, including persisted request ids and operation ids where applicable.
7. Confirm Langfuse, if enabled, captures metadata only and outages do not block product behavior.
8. Confirm LightRAG diagnostics/log tail is safely implemented through the bounded backend route, including audited `diagnostics_unavailable` behavior when no diagnostic file exists.
9. Confirm P9 visual checks for dark/light desktop and narrow viewport.
10. Record open limitations and support contacts.

## Evidence Format

Each P8 launch-gate evidence item records:

- command or manual procedure name;
- date/time;
- environment;
- commit/status reference;
- pass/fail for each step;
- safe request ids, operation ids, audit event ids, or chat trace ids only;
- known limitation or owner when blocked.

Evidence must not include source text, prompts, user questions, assistant answers, provider payloads, raw LightRAG payloads, runtime targets, storage targets, credentials, stack traces, filenames, titles, display names, or raw request bodies.

## P8 Required Proofs

- Fresh migration from empty database.
- Compile/lint/type policy evidence from F-008 `test-plan.md`.
- Secret/safety scan from F-008 `test-plan.md`.
- P8 local compose-replacement smoke proving API health, database connectivity, worker/runtime boundary availability through approved local fakes, private runtime health, and no browser-visible private runtime target.
- Full flow: auth -> domain create/start -> source upload -> source prepare -> source index -> evidence retrieve -> conversation turn stream -> source/domain delete -> chat redaction verification.
- Observability correlation: audit rows, JSON logs, async operation rows, source-index work, and chat turn traces line up through safe ids without exposing private content.
- Failure injection: provider timeout, worker unavailable, DB unavailable, invalid upload, diagnostics unavailable when diagnostics is implemented, and tracing outage.
- Expected-load gate for 10 concurrent authenticated users per QA-004.

## Named Docker Boundary Command

The current live Docker boundary command is:

```text
python -m pytest -m integration_docker -q --basetemp .pytest-tmp-integration-docker
```

This is the command used by `.github/workflows/integration-docker.yml` after confirming Docker availability and pulling the approved controller image fixture. It proves the private Docker controller boundary, not full compose readiness.

## P8 Local Compose-Replacement Smoke

The approved P8 smoke command is:

```text
python scripts/compose_smoke.py
```

This repository still has no deployment compose fixture. For P8, `scripts/compose_smoke.py` is the approved replacement gate: it uses a migrated temp database, local private runtime boundary, local LightRAG client, and in-process API to prove API live/ready, database connectivity, worker-unavailable no-partial-success behavior, worker processing, domain runtime health, evidence retrieval, diagnostics redaction, and no browser-visible private runtime target. F-010 now owns the future current-repo deployment fixture without reopening P8.

## F-010 Runnable Stack Gate

F-010 is the approved phase for adding a current-repo runnable stack. Its first gate must prove:

- one combined compose/local fixture;
- stock `postgres:16` service health;
- Alembic migration to head;
- FastAPI on `127.0.0.1:8000`;
- Next frontend production build/start service on `127.0.0.1:3000`;
- admin login seeded from environment variables;
- `/api/v1/auth/me` through the running stack;
- frontend login route proxying to the API without connection refusal;
- HTTP smoke evidence only for the first gate.

The old `.references/code/context-engine/docker-compose.yml` is evidence only. The F-010 fixture must use current entrypoints and environment names, must not commit working secrets, and must not reintroduce stale Redis/RQ/Celery, worker, status-poller, or deployment-control surfaces for the first gate. Worker containers are deferred until current entrypoints, tests, and acceptance require them.

`next dev` may be documented as an optional local development path against the running API, but it is not the canonical P10 stack gate. Playwright remains F-009 AC-007 unless later contracted P10 operator UI surfaces require it.

AGE/vector/custom Postgres image work is deferred until migrations, indexing, graph, or node contracts require it. If the clean migration smoke fails on stock Postgres, patch the fixture and specs from that evidence before continuing.

## F-010 Local Runnable Stack Procedure

Committed files:

```text
compose.p10.yml
.env.p10.example
Dockerfile
frontend/Dockerfile
scripts/p10_stack_smoke.py
scripts/p10_safety_scan.py
```

Required local inputs are supplied through shell environment or an ignored env file such as `.env.p10.local`:

```text
POSTGRES_DB=<set locally>
POSTGRES_USER=<set locally>
POSTGRES_PASSWORD=<set locally>
CE_ADMIN_USERNAME=<set locally>
CE_ADMIN_PASSWORD=<set locally>
CE_SESSION_COOKIE_SECURE=false
CONFIG_ENCRYPTION_KEY=<set locally>
CONTEXT_ENGINE_API_BASE=http://api:8000
P10_API_PORT=8000
P10_FRONTEND_PORT=3000
```

Generate `CONFIG_ENCRYPTION_KEY` locally:

```text
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Start:

```text
docker compose --env-file .env.p10.local -f compose.p10.yml up --build -d
```

Smoke from an explicit reset state:

```text
python scripts/p10_stack_smoke.py --env-file .env.p10.local --reset-state --write-evidence _tmp/p10-stack-smoke.json
```

Safety scan:

```text
python scripts/p10_safety_scan.py --smoke-evidence _tmp/p10-stack-smoke.json
```

Stop:

```text
docker compose --env-file .env.p10.local -f compose.p10.yml down
```

Stop preserves the local database volume and generated state.

Reset is destructive for the selected compose project:

```text
docker compose --env-file .env.p10.local -f compose.p10.yml down --volumes --remove-orphans
```

Do not run reset against a project whose local database state must be preserved.

Known first-gate limits:

- worker containers are intentionally absent;
- Runtime Node, Logs, Usage, storage summary, and Docker environment UI/API work is blocked until API-001 and DATA-001 are patched;
- Playwright remains F-009 AC-007;
- `next dev` may be used for local iteration outside this gate, but production build/start is the P10 fixture.
