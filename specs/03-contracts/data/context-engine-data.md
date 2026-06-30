---
id: DATA-001
title: Context Engine Data Contract
status: approved
owner: Context Engine data team
last_reviewed: 2026-06-30
depends_on: [ARCH-003]
supersedes: []
---

# Context Engine Data Contract

## Canonical Tables By Phase

| Phase | Tables / fields |
| --- | --- |
| P1 | `users`, `auth_sessions` |
| P2 | `provider_configs`, `model_profiles`, `runtime_settings` |
| P3 | `domains`, `domain_operations` |
| P4 | `source_documents`, `source_preparation_operations`, `source_blocks`, `source_images` |
| P5 | `source_documents.index_state`, index generation/request/readiness/error fields |
| P7 | `conversations`, `conversation_turns` |
| P8 | `audit_events` |

## State Machines

```text
Domain: stopped | running | deleting
Source: pending | prepared | deleting
Preparation operation: queued | running | succeeded | failed | cancelled
Source index: not_requested | queued | submitting | accepted | ready | failed | cancelling | cancelled
Turn: running | completed | failed | redacted
```

Failure belongs to operation/index/turn fields, not extra domain/source states.

## Migration Rules

- Each phase with data changes includes Alembic migrations and a fresh-upgrade test.
- Do not add generic JSON settings, workflow/job tables, index history tables, query logs, runtime manifest/env tables, or persisted rendered LightRAG input unless an approved spec changes this contract.
- Destructive migrations need explicit rollback/compensation and acceptance evidence.

## P2 Runtime Config Tables

`provider_configs`

| Field | Rule |
| --- | --- |
| `provider_kind` | Primary key; closed set `openai`, `bedrock`, `ollama`, `reducto`. |
| `display_name` | Safe internal label. |
| `requires_credentials` | True for `openai`, `bedrock`, and `reducto`; false for `ollama`. |
| `credential_ciphertext` | Nullable encrypted credential only; never returned by API. |
| `credential_updated_at` | Nullable private rotation timestamp; never returned by API. |
| `created_at`, `updated_at` | Service timestamps. |

`model_profiles`

| Field | Rule |
| --- | --- |
| `id` | Opaque profile id. Seeded catalog profiles use stable seed ids such as `openai-embedding-default`. |
| `name` | Administrator-facing safe label. |
| `profile_kind` | Closed set `synthesis`, `embedding`. |
| `provider_kind` | Closed set `openai`, `bedrock`, `ollama`; `reducto` is not valid for model profiles. |
| `model_name` | Provider model identifier; safe model metadata. |
| `vector_dimensions` | Positive integer required for embedding profiles and absent for synthesis profiles. |
| `created_at`, `updated_at` | Service timestamps. |

`runtime_settings`

| Field | Rule |
| --- | --- |
| `id` | Singleton primary key constrained to `1`. |
| `active_synthesis_profile_id` | Nullable foreign key to a synthesis profile. Service validation requires its provider to be ready before activation. |
| `active_parser_kind` | Closed set `docling`, `reducto`; defaults to `docling`. Service validation requires Reducto credentials before setting `reducto`. |
| `created_at`, `updated_at` | Service timestamps. |


## P2 Seeded Model Catalog

`seed_runtime_config` seeds a curated model catalog idempotently. Seeded profiles are normal `model_profiles` rows; no generic JSON settings or runtime files are introduced.

Default seed ids:

| Seed id | Profile kind | Provider | Model | Dimensions | Rule |
| --- | --- | --- | --- | --- | --- |
| `openai-embedding-default` | `embedding` | `openai` | `text-embedding-3-small` | `1536` | Default domain-create preselect. |
| `openai-synthesis-default` | `synthesis` | `openai` | `gpt-4.1-mini` | null | Default active synthesis once OpenAI credentials exist. |

Additional seeded OpenAI and Bedrock profiles are catalog rows only. `model_profiles.model_name` remains safe model metadata. API create/patch validates model names and embedding dimensions against the catalog.


## P3 Knowledge Domain Tables

`domains`

| Field | Rule |
| --- | --- |
| `id` | Primary key administrator slug, `String(64)`, regex `^[a-z0-9][a-z0-9_-]{1,62}$`. Hard delete frees the slug for reuse. |
| `display_name` | Safe label, `String(120)`, defaults to `id` when omitted. |
| `state` | Closed set `stopped`, `running`, `deleting`. No failure/error/unhealthy states. |
| `embedding_profile_id` | Required FK to `model_profiles.id`; must reference an embedding profile. Immutable after create. |
| `runtime_instance_id` | Required private UUID for runtime fencing. Never returned by API/logs. |
| `control_generation` | Required integer, defaults to `1`; increments when delete is accepted to fence stale workers. |
| `created_at`, `updated_at` | Service timestamps. |

Indexes: primary key on `id`; index on `embedding_profile_id`.

Explicitly omitted from `domains`: `available`, `health_status`, failure message fields, runtime URL, host port, path, DB name, container id, provider config, and generic JSON metadata.

`domain_operations`

| Field | Rule |
| --- | --- |
| `id` | Opaque operation UUID primary key. |
| `domain_id` | Required FK to `domains.id` with `ON DELETE CASCADE`. |
| `operation_type` | Closed set `create`, `start`, `stop`, `delete`. |
| `status` | Closed set `queued`, `running`, `succeeded`, `failed`, `cancelled`. Active means `queued` or `running`. |
| `control_generation_at_start` | Copy of `domains.control_generation` when operation is created. |
| `requested_by_user_id` | Nullable FK to `users.id`; null means worker/system. |
| `message` | Nullable safe operator message; no stack traces, paths, URLs, or payloads. |
| `error_code`, `error_message` | Nullable safe terminal failure details. Domain failure state lives here, not on `domains`. |
| `lease_owner`, `lease_expires_at` | Nullable delete-worker claim fields; used by async delete only. |
| `started_at`, `finished_at`, `created_at`, `updated_at` | Operation timestamps. |

Indexes: `(domain_id, created_at DESC)` for history and partial unique `uq_domain_operations_one_active` on `(domain_id)` where `status IN ('queued','running')`.

P3 lifecycle execution: create/start/stop write operation rows and complete in the API request; delete writes an operation row and is completed asynchronously by the worker.

Delete/recreate fencing: delete accept sets `state = deleting`, increments `control_generation`, and records the new generation on the delete operation. Worker/controller commits must match both `runtime_instance_id` and `control_generation`; mismatch means stale work no-ops. Delete completion hard-deletes the domain row and cascades operations. Recreate of the same slug creates a new `runtime_instance_id` and resets `control_generation` to `1`.

Domain availability is computed, never stored:

```text
domain.state == "running"
AND no active domain_operation exists
AND fresh private controller health is healthy
```
