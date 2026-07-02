---
id: DATA-001
title: Context Engine Data Contract
status: approved
owner: Context Engine data team
last_reviewed: 2026-07-02
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
| P7 | `conversations`, `conversation_turns`, `conversation_turn_evidence_refs` |
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

## P4 Source Document Preparation Tables

`source_documents`

| Field | Rule |
| --- | --- |
| `id` | Opaque UUID string primary key. Source ids are admin API resource identifiers, not labels. |
| `domain_id` | Required FK to `domains.id` with `ON DELETE CASCADE` as database safety. |
| `original_filename` | Sanitized uploaded filename for safe admin display only; never a client path. |
| `content_type` | Safe allowlisted upload content type captured at upload. |
| `original_sha256` | SHA-256 hash of immutable original bytes. |
| `original_size_bytes` | Positive original upload size in bytes. |
| `state` | Closed set `pending`, `prepared`, `deleting`; failure details live on operations. |
| `parser_kind` | Frozen parser kind copied from `runtime_settings.active_parser_kind` at upload; closed set `docling`, `reducto`. |
| `preparation_generation` | Positive integer fence, starts at `1`, increments on retry, cancel, and delete. |
| `created_by_user_id` | Nullable FK to `users.id` with `ON DELETE SET NULL`. |
| `created_at`, `updated_at` | Service timestamps. |

Indexes and constraints: unique `(domain_id, original_sha256)`; index `(domain_id, created_at DESC)`; checks for source state, parser kind, positive size, and `preparation_generation >= 1`.

Delete behavior: in P4, source and domain delete hard-delete Source Document rows after private original/image file cleanup. After P5 adds indexed content, accepted or ready remote LightRAG content must be deleted and verified absent before the local Source Document row, Source Blocks, Source Images, or private files are removed. Because sources are hard-deleted, duplicate-hash checks are scoped to currently retained rows only.

`source_preparation_operations`

| Field | Rule |
| --- | --- |
| `id` | Opaque operation UUID primary key. |
| `source_document_id` | Required FK to `source_documents.id` with `ON DELETE CASCADE`. |
| `domain_id` | Required FK to `domains.id` with `ON DELETE CASCADE` for domain operation history queries. |
| `operation_type` | Closed set `prepare` in P4. Retry creates another prepare operation; delete is not a preparation operation. |
| `status` | Closed set `queued`, `running`, `succeeded`, `failed`, `cancelled`. Active means `queued` or `running`. |
| `preparation_generation_at_start` | Copy of `source_documents.preparation_generation` when the operation is created or claimed. |
| `requested_by_user_id` | Nullable FK to `users.id` with `ON DELETE SET NULL`; null means worker/system. |
| `message` | Nullable safe operator message; no stack traces, paths, URLs, parser payloads, source text, or provider details. |
| `error_code`, `error_message` | Nullable safe terminal failure details. |
| `lease_owner`, `lease_expires_at` | Nullable source-preparation worker claim fields. |
| `started_at`, `finished_at`, `created_at`, `updated_at` | Operation timestamps. |

Indexes and constraints: partial unique active operation per `source_document_id` where `status IN ('queued','running')`; index `(domain_id, created_at DESC)`; index `(source_document_id, created_at DESC)`.

Claim rule: a worker may claim an operation when `status = queued` or when `status = running` and `lease_expires_at < now`. Claim sets `running`, `lease_owner`, `lease_expires_at`, and `started_at`.

`source_blocks`

| Field | Rule |
| --- | --- |
| `id` | Stable Context Engine-owned UUID primary key. |
| `source_document_id` | Required FK to `source_documents.id` with `ON DELETE CASCADE`. |
| `domain_id` | Required FK to `domains.id` with `ON DELETE CASCADE`. |
| `source_order` | Positive integer order within the Canonical Source; unique per Source Document. |
| `kind` | Closed set `text`, `table`, `figure`. |
| `canonical_markdown` | Normalized canonical content; restricted data and not exposed by P4 APIs. |
| `heading_level` | Nullable positive heading level for outline/evidence metadata. |
| `page_start`, `page_end` | Nullable positive page range; when both are present `page_end >= page_start`. |
| `section_path` | Nullable structured safe heading labels, stored as JSON/text depending on dialect; no parser-native payload. |
| `created_at` | Service timestamp. |

Indexes and constraints: unique `(source_document_id, source_order)`; index `(domain_id, source_document_id)`.

`source_images`

| Field | Rule |
| --- | --- |
| `id` | Stable Context Engine-owned UUID primary key. |
| `source_document_id` | Required FK to `source_documents.id` with `ON DELETE CASCADE`. |
| `source_block_id` | Required FK to `source_blocks.id` with `ON DELETE CASCADE`. |
| `content_hash` | Image bytes hash. |
| `mime_type` | Safe image MIME type. |
| `alt_text` | Nullable safe label. |
| `page_number` | Nullable positive page number. |
| `created_at` | Service timestamp. |

P4 parser-native payloads, task ids, parser/provider URLs, storage paths, credentials, bbox metadata, and parser config JSON are not persisted. Source Blocks and image files are deleted with their Source Document or Knowledge Domain after any P5 remote-index cleanup required for indexed sources.

## P5 LightRAG Indexing Fields

P5 extends `source_documents` with source-owned index lifecycle fields. Do not create a `source_index_operations` table, index history table, status mirror table, generic jobs table, query log, generic metadata JSON column, raw LightRAG payload column, provider payload column, or persisted rendered-input column.

`source_documents` P5 additions:

| Field | Rule |
| --- | --- |
| `index_state` | Closed set `not_requested`, `queued`, `submitting`, `accepted`, `ready`, `failed`, `cancelling`, `cancelled`; defaults to `not_requested`. |
| `index_generation` | Nonnegative integer stale-work fence; defaults to `0`; increments before queueing an index request, manual retry, cancel fence, and delete fence. |
| `index_request_id` | Nullable idempotency key for the current generation; required once a source is queued for indexing; generated deterministically from source identity, index generation, and rendered content hash. |
| `index_content_hash` | Nullable SHA-256 hash of deterministic `render_lightrag_input()` output; rendered text itself is not persisted. |
| `index_remote_document_id` | Nullable private remote identity only if the pinned LightRAG fixture proves one is required; never returned by API DTOs, logs, or traces. |
| `index_error_code`, `index_error_message` | Nullable safe terminal failure details only; no upstream payload, stack trace, source text, provider detail, runtime URL, or path. |
| `index_lease_owner`, `index_lease_expires_at` | Nullable index-worker claim fields for source-scoped submit/readiness/delete work. |
| `index_accepted_at`, `index_ready_at`, `index_updated_at` | Nullable lifecycle timestamps. |

Indexes and constraints: check `index_state` in the approved enum; check `index_generation >= 0`; index `(domain_id, index_state)` for worker/status scans if needed by implementation; do not add uniqueness constraints that prevent normal source hard delete/recreate behavior. Existing prepared sources created before P5 migrate to `index_state = not_requested` and `index_generation = 0`.

P5 index state transitions:

```text
not_requested -> queued -> submitting -> accepted -> ready
submitting | accepted -> failed
accepted | ready | failed | cancelled -> queued
queued | submitting | accepted | ready -> cancelling -> cancelled
```

Active index work means `queued`, `submitting`, `accepted`, or `cancelling`. Retry from `accepted`, `ready`, `failed`, or `cancelled` is allowed only after old remote content is absent or proved never accepted. Timeout is an uncertain state: retry the same generation with the same `index_request_id` or reconcile native readiness/absence before creating a new generation.

Worker result fencing:

```text
worker_result_is_current =
  source.index_generation == worker_generation
  AND source.index_request_id == worker_request_id
  AND source.state == "prepared"
  AND source.index_state NOT IN ("cancelling", "cancelled")
```

If false, submit/readiness/failure results write zero readiness rows and must not make the source query-eligible.

Deterministic render contract:

```text
[CE_SOURCE schema=1 source_id=<source-id> sha256=<original-sha256>]

[CE_BLOCK id=<source-block-id> order=<source-order>]
<canonical_markdown>
```

`render_lightrag_input()` reads `source_blocks` ordered by `source_order`, rejects non-prepared or zero-block sources, normalizes line endings, includes every Source Block id exactly once, and returns rendered text plus `index_content_hash`. It does not read original files, call Docling or Reducto, include image bytes, persist rendered text, or write rendered text to logs/traces/fixtures/API DTOs.

Query eligibility is one server-side predicate owned by P5 and reused by later retrieval/chat phases:

```text
source_is_query_eligible(source, domain) =
  domain is available by P3 rules
  AND source.state == "prepared"
  AND source.index_state == "ready"
  AND source index generation/request identity is current
  AND no delete or cancel fence is active
```

P6 and P7 must call this helper instead of copying the conditions. Frontend code must not compute query eligibility.

## P7 Conversation And Turn Tables

`conversations`

| Field | Rule |
| --- | --- |
| `id` | Opaque conversation id primary key. |
| `owner_user_id` | Required FK to `users.id`; all conversation APIs are owner-filtered. |
| `title` | Nullable safe label generated or provided by user; no prompts or source text beyond user-visible conversation title. |
| `created_at`, `updated_at` | Service timestamps. |

`conversation_turns`

| Field | Rule |
| --- | --- |
| `id` | Opaque turn id primary key. |
| `conversation_id` | Required FK to `conversations.id` with `ON DELETE CASCADE`. |
| `client_request_id` | Required client idempotency key, unique per conversation. |
| `domain_id` | Nullable FK to `domains.id`; required when `route = domain_rag`, null when `route = direct_llm`. |
| `route` | Closed set `direct_llm`, `domain_rag`; assigned by server intent gate only. |
| `status` | Closed set `running`, `completed`, `failed`, `redacted`. |
| `stop_reason` | Nullable closed set `direct_llm`, `grounded`, `no_grounded_context`, `evidence_only`, `turn_budget_exhausted`, `provider_failure`, `citation_validation_failed`, `cancelled`, `redacted`. |
| `user_message` | User-visible question text; confidential, owner-scoped, retained after redaction. |
| `assistant_answer` | Nullable derived answer text; direct LLM or grounded answer only after safe projection; cleared on redaction where required. |
| `safe_error_code`, `safe_error_message` | Nullable safe terminal failure details only. |
| `plan_step_count`, `retrieval_operation_count`, `repair_attempt_count` | Nonnegative safe counters for budget proof; no planning text. |
| `created_at`, `started_at`, `completed_at`, `updated_at` | Service timestamps. |

Indexes and constraints: unique `(conversation_id, client_request_id)`; partial unique running turn per conversation where `status = 'running'`; check `route`, `status`, and `stop_reason` enums; check `domain_id IS NOT NULL` for `domain_rag` and `domain_id IS NULL` for `direct_llm`.

`conversation_turn_evidence_refs`

| Field | Rule |
| --- | --- |
| `id` | Opaque evidence reference id primary key. |
| `turn_id` | Required FK to `conversation_turns.id` with `ON DELETE CASCADE`. |
| `source_document_id`, `source_block_id` | Private FKs for redaction and citation validation; never returned directly to browser. |
| `citation_label` | Safe user-visible label used in the answer. |
| `excerpt` | Approved safe excerpt only; no raw source text beyond API-approved evidence excerpt. |
| `created_at` | Service timestamp. |

Direct LLM turns must not create evidence refs. Domain/source delete redacts affected domain-grounded turn answers and evidence refs while preserving `user_message`.
