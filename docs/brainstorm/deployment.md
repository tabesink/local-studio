# Deployment And Local Run Modes

This document describes planned deployment shape and operational guardrails. The repo does not yet contain runtime code or Compose files.

## Planned Local Services

Static services:

- `postgres`: app database plus per-domain LightRAG databases.
- `migrate`: runs Alembic migrations once.
- `api`: FastAPI application.
- `worker`: one process for domain delete completion, source preparation, indexing, readiness sweep, and remote cleanup.
- `domain-controller`: private lifecycle controller with Docker socket access.

Dynamic services:

- `ce-lr-*`: one private LightRAG runtime container per running domain.

Only the API should expose a local development port. Postgres, worker, domain controller, and LightRAG runtimes should not expose host ports by default.

## Local Run Modes

P1 development:

```text
postgres + migrate + api
```

P3 and later:

```text
postgres + migrate + api + worker + domain-controller
dynamic LightRAG runtime containers started by the controller
```

Frontend development, once added, should call only the Context Engine API. Do not add browser environment variables for provider secrets, runtime URLs, controller URLs, or storage paths.

## Planned Environment Variables

P1:

| Name | Required | Notes |
|---|---:|---|
| `APP_ENV` | yes | `development`, `test`, or `production`. |
| `DATABASE_URL` | yes | App DB URL. Never log. |
| `SEED_ADMIN_USERNAME` | yes | Creates admin only if absent. |
| `SEED_ADMIN_PASSWORD` | yes | Required at startup. Never log. Reject weak values outside dev. |
| `SESSION_TTL_HOURS` | yes | Positive integer. |
| `COOKIE_SECURE` | yes | Must be true outside dev. |
| `LOG_LEVEL` | yes | Safe structured logging only. |

P2:

| Name | Required | Notes |
|---|---:|---|
| `CONFIG_ENCRYPTION_KEY` | yes | Fernet key. Required outside test. Never log. |
| `OLLAMA_BASE_URL` | conditional | Required only when Ollama profiles are used. Not browser-visible. |

P3:

| Name | Required | Notes |
|---|---:|---|
| `CONTEXT_DATA_ROOT` | yes for controller | Controller-owned data root, gitignored. |
| `DOMAIN_CONTROLLER_AUTH_TOKEN` | yes | Long random token shared by API/worker/controller only. |
| `DOMAIN_CONTROL_URL` | yes | Private network URL for controller. |
| `DOMAIN_LIFECYCLE_TIMEOUT_SECONDS` | yes | Bounded lifecycle action timeout. |
| `DOMAIN_RUNTIME_HEALTH_TIMEOUT_SECONDS` | yes | Bounded runtime health probe. |
| `DOMAIN_STATUS_FRESH_SECONDS` | yes | Health observation freshness window. |
| `LIGHTRAG_RUNTIME_IMAGE` | yes | Pinned tag/digest. Never `latest`. |
| `LIGHTRAG_RUNTIME_CONTAINER_PORT` | yes | Internal container port only. |
| `LIGHTRAG_RUNTIME_HEALTH_PATH` | yes | Internal health path. |
| `LIGHTRAG_RUNTIME_DATABASE_URL` | controller only | Controller root DB connectivity for runtime DB creation/removal. |

P4-P7:

| Name | Required | Notes |
|---|---:|---|
| `SOURCE_PREPARATION_TIMEOUT_SECONDS` | yes | Parser timeout. |
| `SOURCE_PREPARATION_LEASE_SECONDS` | yes | Worker lease window. |
| `SOURCE_PREPARATION_IDLE_SLEEP_SECONDS` | yes | Worker idle sleep. |
| `MAX_SOURCE_UPLOAD_BYTES` | yes | Server-owned upload cap. |
| `MAX_SOURCE_BLOCKS` | yes | Prepared output cap. |
| `MAX_SOURCE_IMAGE_BYTES` | yes | Prepared image cap. |
| `PREPARED_SOURCE_SCHEMA_VERSION` | yes | Canonical prepared schema version. |
| `LIGHTRAG_SUBMIT_TIMEOUT_SECONDS` | yes | Index submit timeout. |
| `LIGHTRAG_READINESS_TIMEOUT_SECONDS` | yes | Native readiness timeout. |
| `LIGHTRAG_READINESS_SWEEP_SECONDS` | yes | Worker sweep cadence. |
| `LIGHTRAG_RETRIEVAL_TIMEOUT_SECONDS` | yes | Retrieval timeout. |
| `RAG_QUERY_FLOW` | yes | `single_shot` default or `controlled_agentic`. Invalid value fails startup. |
| `SYNTHESIS_TIMEOUT_SECONDS` | yes | Provider answer timeout. |
| `MAX_CONCURRENT_SYNTHESIS_STREAMS` | yes | Server-owned stream cap. |
| `QUERY_CLASSIFIER_TIMEOUT_SECONDS` | yes | Classifier timeout. |

P8:

| Name | Required | Notes |
|---|---:|---|
| tracer endpoint/key vars | optional | Metadata-only. Exporter failure must not block requests. Exact names deferred to P8. |

## Secrets

Never commit `.env` files with real values. Never print env values, credentials, tokens, database dumps, private URLs, or encryption keys. Redact secrets in diagnostics and handoffs.

Provider API keys belong in encrypted provider config rows, not deployment env vars, except for the encryption root key itself.

## Migrations

Use Alembic once the backend exists.

Rules:

- migrations must run from a fresh database;
- migrations must not call Docker, providers, LightRAG, parser services, or create runtime data;
- production does not auto-downgrade;
- backup and restore proof is required before production migration;
- schema changes must update `docs/DATABASE_OWNERSHIP.md`.

Planned migration order:

1. `0001_users_and_sessions`
2. `0002_trusted_runtime_config`
3. `0003_domain_lifecycle`
4. `0004_source_documents_and_preparation`
5. `0005_source_index_state`
6. reserved P6 narrow indexes if needed
7. `0007_conversations_and_turns`
8. P8 metadata/trace tables only if a later ADR requires persistence

## Storage And Backups

Back up:

- PostgreSQL app database;
- per-domain LightRAG databases;
- private source storage under the controller-owned data root.

Do not back up:

- generated runtime containers;
- transient staging folders older than active operations after recovery cleanup;
- raw logs that may contain operational internals unless retention and masking policy exists.

Restore proof before pilot:

```text
restore Postgres + source storage + runtime DBs
start api + worker + controller
start a domain
retrieve mapped evidence
delete a source/domain and verify cleanup still works
```

## Production Checklist

- `COOKIE_SECURE=true`.
- strong random session and controller tokens.
- `CONFIG_ENCRYPTION_KEY` stored in secret management, not source.
- LightRAG image pinned by tag and digest.
- no host port for Postgres, controller, worker, or runtimes.
- containers run non-root where practical.
- data roots and DB backups use restrictive permissions.
- CORS restricted to trusted app origins.
- debug pages disabled.
- rate limits configured at ingress/API for login, uploads, retrieval/chat, and per-domain runtime queries.
- structured logs verified to exclude never-log fields.

