---
title: Runnable stack workers via Postgres lease poll loop
date: 2026-07-10
category: architecture-patterns
module: F-010 runnable stack
problem_type: architecture_pattern
component: background_job
severity: high
applies_when:
  - "Adding background prepare, index, or domain-delete processing to the local compose stack"
  - "Stack smoke must prove upload through redaction without in-process worker calls"
  - "Renaming phase-coded stack fixtures to durable stack names"
tags:
  - runnable-stack
  - postgres-lease
  - compose-worker
  - stack-smoke
  - f-010
related_components:
  - development_workflow
  - testing_framework
  - documentation
---

# Runnable stack workers via Postgres lease poll loop

## Context

The F-010 runnable stack started Postgres, API, and frontend, but no process claimed prepare, index, or domain-delete leases. Uploads queued in Postgres never advanced, so the product behaved like a login shell rather than a RAG app. Fixture names still used phase-coded `p10` prefixes, and stack safety scan rejected any compose `worker:` service.

F-010 slice (branch `feat/runnable-stack-workers`, commits `9709143b` through `eb6cfb3c`) closed that gate: one compose worker, hard-cut `stack` naming, and full pilot-path HTTP smoke.

## Guidance

### 1. One lease poll loop — no job platform

Run a single process that round-robins existing `run_once` workers:

```text
loop forever:
  open session
  did = prep.run_once(db) or index.run_once(db) or delete.run_once(db)
  close session
  if not did: sleep(idle_seconds)
```

Entrypoint: `python -m context_engine.worker` (`context_engine/worker.py`). Workers self-commit inside `run_once`; the loop only opens/closes sessions. On unexpected errors, log a safe structured event and sleep the idle interval — do not busy-loop.

Reject Redis, RQ, Celery, status-poller, and deployment-control services. Safety scan allows only the CE lease poller named `worker`.

### 2. Compose shape

Canonical fixture: `compose.stack.yml` with services `postgres`, `migrate`, `api`, `worker`, `frontend`.

Critical mounts on **both** `api` and `worker`:

- `stack-source-storage` → `CE_SOURCE_STORAGE_ROOT=/data/source-storage`
- `stack-domain-runtimes` → `CE_DOMAIN_RUNTIME_ROOT=/data/domain-runtimes`

Without shared volumes, prepare/delete fail across containers because uploaded files and runtime roots are invisible to the worker.

Slice 0 keeps `CE_DOMAIN_RUNTIME_CONTROLLER_KIND=local` and `CE_LIGHTRAG_CLIENT_KIND=local`. Production Settings default remains native (LD-006).

### 3. Frontend API base inside compose

Hardcode the frontend build/runtime API base to the compose service DNS name:

```yaml
CONTEXT_ENGINE_API_BASE: http://api:8000
```

Do not pass through host-native values like `http://127.0.0.1:8000` from `.env.stack.local`. Inside the frontend container that resolves to the container itself and breaks proxy login with `ECONNREFUSED`.

Host-native `scripts/dev.sh` may still use `http://127.0.0.1:8000` — that is separate from compose.

### 4. Stack smoke proves the worker advances state

`scripts/stack_smoke.py` drives the API over HTTP only. It must **never** call `SourcePreparationWorker`, `SourceIndexWorker`, or `DomainDeleteWorker` in-process.

After auth/proxy checks, smoke mirrors the pilot path:

1. Configure provider credential (throwaway value — never written to evidence)
2. Create/start domain
3. Upload markdown source
4. Poll admin source DTO until `state=prepared` and `indexState=ready`
5. Retrieve evidence
6. One domain-grounded chat SSE turn (`stopReason=grounded`)
7. Delete source → assert turn `redacted`
8. Accept domain delete → wait until domain gone

Evidence JSON stays status/id only. Run `scripts/stack_safety_scan.py` on the evidence artifact.

### 5. Hard-cut rename to `stack`

Canonical names only — no `p10` aliases:

| Former | Canonical |
| --- | --- |
| `compose.p10.yml` | `compose.stack.yml` |
| `.env.p10.example` / `.env.p10.local` | `.env.stack.example` / `.env.stack.local` |
| `scripts/p10_stack_smoke.py` | `scripts/stack_smoke.py` |
| `scripts/p10_safety_scan.py` | `scripts/stack_safety_scan.py` |
| `P10_API_PORT` / `P10_FRONTEND_PORT` | `STACK_API_PORT` / `STACK_FRONTEND_PORT` |
| `context_engine_p10` | `context_engine_stack` |
| `p10-postgres-data` | `stack-postgres-data` (+ `stack-source-storage`, `stack-domain-runtimes`) |

Volume rename starts a fresh local database unless the operator migrates data manually.

## Why This Matters

Backend-owned lifecycle already uses Postgres row locks for prepare, index, and delete. A compose stack without a worker process leaves that lifecycle orphaned — smoke and operators see queued work that never completes. Shared storage/runtime volumes and HTTP-only smoke are the minimum proof that multi-container compose actually runs the product path end-to-end.

## When to Apply

- Extending F-010 runnable stack acceptance
- Debugging "upload stuck in queued" or "index never ready" in compose
- Adding new background work — extend existing `run_once` workers and the poll loop, not a job bus
- Renaming stack fixtures — update specs, runbook, safety scan targets, and traceability in the same change

## Examples

**Start stack (default ports):**

```bash
docker compose --env-file .env.stack.local -f compose.stack.yml -p context_engine_stack up --build -d
python scripts/stack_smoke.py --env-file .env.stack.local --reset-state --write-evidence _tmp/stack-smoke.json
python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json
```

**Worker loop unit tests:**

```bash
pytest tests/test_stack_worker_loop.py tests/test_stack_safety_scan.py tests/test_stack_smoke_helpers.py -q
```

**Verified smoke checks (2026-07-10):** `worker_running`, `source_prepared_indexed` (`state=prepared`; `indexState=ready`), `domain_chat` (`stopReason=grounded`), `source_delete_redaction` (`turnStatus=redacted`), `domain_delete`.

## Related

- Plan: `docs/plans/2026-07-10-001-feature-runnable-stack-workers-plan.md`
- Feature evidence: `specs/04-features/F-010-shared-node-operations/implementation-log.md`
- Runbook: `specs/06-delivery/runbooks/pilot-launch.md`
- Review residuals: `docs/residual-review-findings/feat-runnable-stack-workers.md`
