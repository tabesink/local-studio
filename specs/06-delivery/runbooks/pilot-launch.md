---
id: RUN-001
title: Pilot Launch Runbook
status: approved
owner: Context Engine operations team
last_reviewed: 2026-07-10
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

For P8, `scripts/compose_smoke.py` is the approved in-process replacement gate: it uses a migrated temp database, local private runtime boundary, local LightRAG client, and in-process API to prove API live/ready, database connectivity, worker-unavailable no-partial-success behavior, worker processing, domain runtime health, evidence retrieval, diagnostics redaction, and no browser-visible private runtime target. F-010 owns the current-repo deployment compose fixture (`compose.stack.yml`) and does not reopen P8.

## F-010 Runnable Stack Gate

F-010 is the approved phase for the current-repo runnable stack. The stack gate must prove:

- one combined compose fixture `compose.stack.yml`;
- stock `postgres:16` service health;
- Alembic migration to head;
- FastAPI on `127.0.0.1:${STACK_API_PORT:-8000}`;
- one CE lease worker service running `python -m context_engine.worker`;
- Next frontend production build/start service on `127.0.0.1:${STACK_FRONTEND_PORT:-3000}`;
- admin login seeded from environment variables;
- `/api/v1/auth/me` through the running stack;
- frontend login route proxying to the API without connection refusal;
- full pilot path over HTTP: upload → prepare → index → evidence → domain-grounded chat → delete → redaction, with the compose worker advancing state (no in-process `run_once` in stack smoke).

The old `.references/code/context-engine/docker-compose.yml` is evidence only. The F-010 fixture must use current entrypoints and environment names, must not commit working secrets, and must not reintroduce Redis/RQ/Celery, status-poller, or deployment-control. Exactly one CE lease worker is required and allowed.

`next dev` may be documented as an optional local development path against the running API, but it is not the canonical stack gate. Playwright remains F-009 AC-007 unless later contracted P10 operator UI surfaces require it.

AGE/vector/custom Postgres image work is deferred until migrations, indexing, graph, or node contracts require it. If the clean migration smoke fails on stock Postgres, patch the fixture and specs from that evidence before continuing.

Stack acceptance for this gate uses local domain-runtime and LightRAG client kinds (`CE_DOMAIN_RUNTIME_CONTROLLER_KIND=local`, `CE_LIGHTRAG_CLIENT_KIND=local`). Production Settings default remains native per LD-006; live Docker LightRAG is out of this gate’s acceptance.

## F-010 Local Runnable Stack Procedure

Committed files:

```text
compose.stack.yml
.env.stack.example
Dockerfile
frontend/Dockerfile
scripts/stack_smoke.py
scripts/stack_safety_scan.py
```

Required local inputs are supplied through shell environment or an ignored env file such as `.env.stack.local` (recreate from `.env.stack.example`; former `.env.p10.local` is not read):

```text
POSTGRES_DB=<set locally>
POSTGRES_USER=<set locally>
POSTGRES_PASSWORD=<set locally>
CE_ADMIN_USERNAME=<set locally>
CE_ADMIN_PASSWORD=<set locally>
CE_SESSION_COOKIE_SECURE=false
CONFIG_ENCRYPTION_KEY=<set locally>
CONTEXT_ENGINE_API_BASE=http://api:8000
STACK_API_PORT=8000
STACK_FRONTEND_PORT=3000
```

Generate `CONFIG_ENCRYPTION_KEY` locally:

```text
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Start (compose project default `context_engine_stack`):

```text
docker compose --env-file .env.stack.local -f compose.stack.yml -p context_engine_stack up --build -d
```

Smoke from an explicit reset state:

```text
python scripts/stack_smoke.py --env-file .env.stack.local --project-name context_engine_stack --reset-state --write-evidence _tmp/stack-smoke.json
```

If host ports conflict, override ports for the smoke run, for example:

```text
STACK_API_PORT=18000 STACK_FRONTEND_PORT=13000 python scripts/stack_smoke.py --env-file .env.stack.local --project-name context_engine_stack_smoke --reset-state --write-evidence _tmp/stack-smoke.json
```

Safety scan:

```text
python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json
```

Stop:

```text
docker compose --env-file .env.stack.local -f compose.stack.yml -p context_engine_stack down
```

Stop preserves the local database volume and generated state.

Reset is destructive for the selected compose project:

```text
docker compose --env-file .env.stack.local -f compose.stack.yml -p context_engine_stack down --volumes --remove-orphans
```

Do not run reset against a project whose local database state must be preserved.

### Volume rename caveat

Hard-cut rename from former `p10` volume names to `stack-postgres-data`, `stack-source-storage`, and `stack-domain-runtimes` implies a fresh local database unless the operator manually migrates data from the old volumes. Expect empty state after first start on the renamed volumes.

### Volume migration decision tree

Use this when moving from former `p10-*` volumes to `stack-*` volumes, or when deciding whether to keep local data.

1. **Inspect first (read-only)**

```bash
python scripts/stack_volume_inspect.py
python scripts/stack_volume_inspect.py --json
```

The helper lists presence/size/labels for `p10-*` and `stack-*` volume families. It never mutates volumes and never prints host `Mountpoint` paths.

2. **Choose a path**

| Goal | Action |
| --- | --- |
| Intentional fresh start | Keep `stack-*` volumes empty (or `docker compose … down --volumes`) and recreate `.env.stack.local` from `.env.stack.example`. Former `p10-*` volumes can remain unused or be removed later. |
| Preserve Postgres data | Follow the `pg_dump` / `pg_restore` recipe below **and** preserve `CONFIG_ENCRYPTION_KEY` continuity. |
| Files-only (sources / runtimes) | Postgres empty is OK; copy or re-upload sources as needed. Domain-runtime dirs are regenerable; source-storage files are not in the DB. |

3. **Encryption-key continuity (required for Postgres preserve)**

Stored provider credentials are ciphertext under `CONFIG_ENCRYPTION_KEY`.

- Copy the Fernet key from the env file that originally wrote the ciphertext (for example former `.env.p10.local` → `.env.stack.local`).
- Validate it is a Fernet key before restore, for example:
  `python -c "from cryptography.fernet import Fernet; Fernet(b'<key>')"`
- Regenerating `CONFIG_ENCRYPTION_KEY` after restore permanently loses stored credentials and requires re-entry.

4. **Postgres preserve recipe (manual; no guided migrate script)**

```bash
# Example names — adjust project prefixes if your Docker volume names differ.
# Dump from old volume via a temporary Postgres container:
docker run --rm -v p10-postgres-data:/var/lib/postgresql/data -v "$PWD/_tmp:/backup" postgres:16 \
  bash -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /backup/ce-stack.dump'
# After stack volumes exist / stack Postgres is up, restore into stack-postgres-data
# using a matching temp container or exec into the compose postgres service.
# Prefer restore into an empty stack DB, then start the stack with the preserved key.
```

Exact user/db names must match the env that created the dump. Do not commit dump files or print connection passwords into evidence.

5. **Source-storage and domain-runtimes notes**

- `p10-source-storage` / `stack-source-storage`: file blobs for uploads. Preserve only if you also preserve matching DB rows; otherwise re-upload.
- `p10-domain-runtimes` / `stack-domain-runtimes`: regenerable runtime state for local-fake or live binds. Safe to discard for a fresh start.
- Live overlay uses a host bind at `CE_STACK_LIVE_RUNTIME_ROOT` instead of relying on the named domain-runtimes volume alone.

Cross-link: `docs/solutions/architecture-patterns/runnable-stack-postgres-lease-workers.md` § hard-cut rename.

### Known stack-gate limits

- stack acceptance uses local domain-runtime and LightRAG client kinds; production Settings default remains native (LD-006);
- optional live Docker LightRAG overlay is a separate proof (see Live overlay below) — not the default F-010 gate;
- Runtime Node, Logs, Usage, storage summary, and Docker environment UI/API work is blocked until API-001 and DATA-001 are patched;
- Playwright remains F-009 AC-007;
- `next dev` may be used for local iteration outside this gate, but production build/start is the stack fixture;
- Redis/RQ/Celery, status-poller, and deployment-control remain forbidden; the single CE lease worker is required.

### Live overlay (optional native fidelity)

Use this only when you need LD-006-aligned native LightRAG fidelity in compose. It is **not** the default F-010 acceptance gate (`scripts/stack_smoke.py` stays local-fake).

**Prerequisites**

- Docker daemon on the host; local single-operator workstation (not production / shared multi-tenant).
- Absolute host-visible runtime directory, for example:
  `CE_STACK_LIVE_RUNTIME_ROOT=/home/you/.local/share/context-engine/stack-domain-runtimes`
- Provider credentials already required by `.env.stack.local` (same as default stack).
- Live image build installs Docker CLI and `.[lightrag-runtime]` extras (slower/heavier than the slim default image).
- Resource cost: native index is slower; use a longer pilot timeout (live smoke defaults to 600s).

**Threat note:** the live overlay mounts `/var/run/docker.sock` into api/worker so the private domain-runtime controller subprocess can invoke the Docker CLI. This is a documented local single-operator exception to ARCH-002’s socket ban. Do not enable the overlay in production or shared multi-tenant hosts. The API process still must not import Docker; the controller remains a subprocess.

**Commands**

```bash
mkdir -p "$CE_STACK_LIVE_RUNTIME_ROOT"
docker compose --env-file .env.stack.local -f compose.stack.yml -f compose.stack.live.yml config --quiet
python scripts/stack_smoke_live.py --env-file .env.stack.local --reset-state --write-evidence _tmp/stack-smoke-live.json
python scripts/stack_safety_scan.py --live-overlay --smoke-evidence _tmp/stack-smoke-live.json
```

Bounded default path: upload → prepare → index → evidence. Pass `--include-chat` to continue into chat/delete.

**Known limits**

- Default `scripts/stack_smoke.py` never enables the overlay and must keep local kinds.
- Base `compose.stack.yml` safety scan still forbids `docker.sock`; only `--live-overlay` scans the live file with socket allowed.
- Named `stack-domain-runtimes` volume remains the default local-fake path; live uses the host bind at `CE_STACK_LIVE_RUNTIME_ROOT`.
