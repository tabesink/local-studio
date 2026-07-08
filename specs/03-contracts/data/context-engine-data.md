---
id: DATA-001
title: Context Engine Data Contract
status: approved
owner: Context Engine data team
last_reviewed: 2026-07-07
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
| P8 | `audit_events`; nullable private `conversation_turns.trace_id`; nullable origin `domain_operations.request_id`; nullable origin `source_preparation_operations.request_id`; existing `source_documents.index_request_id` for source-index correlation |
| P10 | no schema change for the first runnable-stack gate |
| P11 | `wiki_pages`, `wiki_revisions`, `wiki_contributions`, `wiki_contribution_evidence_refs` |

## State Machines

```text
Domain: stopped | running | deleting
Source: pending | prepared | deleting
Preparation operation: queued | running | succeeded | failed | cancelled
Source index: not_requested | queued | submitting | accepted | ready | failed | cancelling | cancelled
Turn: running | completed | failed | redacted
Wiki Page: published | needs_review | archived
Wiki Contribution: draft | submitted | published | rejected | blocked
Wiki Contribution Evidence Ref: active | invalidated
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
| `request_id` | Nullable server-generated origin request id, max 80 characters. Set from the API request that created the operation; workers preserve it for logs/audit and do not overwrite it. |
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
| `request_id` | Nullable server-generated origin request id, max 80 characters. Set from the API request that created the operation; workers preserve it for logs/audit and do not overwrite it. |
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

Turn terminal mapping:

| Stop reason | Status | `assistant_answer` | Evidence refs |
| --- | --- | --- | --- |
| `direct_llm` | `completed` | required non-empty safe projected direct answer | none |
| `grounded` | `completed` | required non-empty safe grounded answer | one or more |
| `no_grounded_context` | `completed` | null | none |
| `evidence_only` | `completed` | null | one or more |
| `turn_budget_exhausted` | `completed` or `failed` based on whether a safe terminal answer exists | nullable | zero or more |
| `provider_failure` | `failed` unless mapped to `evidence_only` after Evidence | null | zero or more |
| `citation_validation_failed` | `failed` | null | one or more attempted refs allowed only if safe |
| `cancelled` | `failed` | null | zero or more |
| `redacted` | `redacted` | null | none returned publicly |

The service must not hold a database transaction open across provider streaming or LightRAG retrieval. Claim the turn, commit, run external work, then reopen short transactions for Evidence persistence and terminal state.

`conversation_turn_evidence_refs`

| Field | Rule |
| --- | --- |
| `id` | Opaque evidence reference id primary key. |
| `turn_id` | Required FK to `conversation_turns.id` with `ON DELETE CASCADE`. |
| `evidence_order` | Positive integer order within the turn; unique per turn. |
| `source_document_id`, `source_block_id` | Private FKs for redaction and citation validation; never returned directly to browser. |
| `citation_label` | Safe user-visible label used in the answer; cleared to null on redaction. |
| `source_label` | Safe Source Document display label, max 255 characters; copied from the mapped Source Document at retrieval time; cleared to null on redaction. |
| `excerpt` | Approved safe excerpt only; no raw source text beyond API-approved evidence excerpt; cleared to null on redaction. |
| `redacted_at` | Nullable service timestamp. When set, the row is redacted: public fields are cleared and the row is omitted from API/SSE/replay evidence payloads. Private `source_document_id` and `source_block_id` may remain for internal audit until the source row is removed. |
| `created_at` | Service timestamp. |

Indexes and constraints: unique `(turn_id, evidence_order)`; unique `(turn_id, citation_label)` where `redacted_at IS NULL`; check `evidence_order >= 1`; check `(redacted_at IS NULL) OR (citation_label IS NULL AND source_label IS NULL AND excerpt IS NULL)`.

Direct LLM turns must not create evidence refs. Domain/source delete redacts affected domain-grounded turn answers and evidence refs while preserving `user_message`.

## P7 Redaction Persistence Rules

Redaction is a server-side data transition, not UI masking.

When a source or Knowledge Domain delete triggers chat redaction:

1. Find affected `domain_rag` turns by deleted domain id or by evidence refs whose private `source_document_id` / `source_block_id` belongs to the deleted source.
2. Run redaction before local source/domain rows are removed so private lookup ids are still available.
3. **Redact the entire turn** when any cited source or the turn's domain is deleted. Do not partially redact individual refs while leaving the assistant answer intact.
4. For each affected turn, set `conversation_turns.status = redacted`, `stop_reason = redacted`, clear `assistant_answer`, and clear safe error fields unless an approved redaction code is required.
5. For **every** evidence ref on those turns, set `redacted_at`, clear `citation_label`, `source_label`, and `excerpt`, and **retain the row**. Do not delete evidence ref rows on redaction.
6. Preserve `conversation_turns.user_message` unchanged.
7. After source hard-delete, redacted evidence ref rows may retain orphan private `source_document_id` / `source_block_id` values for internal audit. Public mappers must never expose them.

Public contract after redaction:

- Conversation detail, SSE replay, and idempotent replay return empty `evidence` and `citations` for redacted turns.
- Redacted evidence ref rows remain in Postgres for internal audit only; public mappers must treat `redacted_at IS NOT NULL` as absent.
- Private `source_document_id` and `source_block_id` on redacted rows are never returned to the browser.

## P7 Internal Evidence Bridge

The public P6 Evidence DTO intentionally omits `source_document_id` and `source_block_id`. P7 therefore uses an internal mapped-evidence bridge below the public API layer:

```text
P6 RetrievalPort internal result =
  source_document_id
  source_block_id
  source_label
  excerpt
  retrieval_order
```

Only P7 services, citation validation, and redaction hooks may read the private ids. Public APIs and SSE convert each internal result into a `conversation_turn_evidence_refs.id` plus `citation_label`, `source_label`, and `excerpt`.

## P7 Idempotency Persistence Rules

- Duplicate detection uses `(conversation_id, client_request_id)`.
- If an existing turn has the same `client_request_id`, the service compares the submitted `message` to `conversation_turns.user_message` and the effective domain to `conversation_turns.domain_id`.
- A mismatch returns `client_request_conflict` and does not create a second row.
- A running existing turn returns `conversation_turn_in_progress`.
- A completed, failed, or redacted existing turn is replayed from persisted safe fields and never calls the provider, LightRAG, or the P6 retriever again.
- Supplied `domainId` always makes the effective route `domain_rag`; direct LLM turns persist and compare `domain_id = null` only when no `domainId` was supplied and the server intent gate classified the request as direct general chat.

## P11 Wiki Curation Tables

P11 adds governed wiki curation state. Wiki content is curated internal product text. It is not Source Document storage, raw Evidence storage, raw answer storage, or a browser-local notes cache.

`wiki_pages`

| Field | Rule |
| --- | --- |
| `id` | Opaque Wiki Page id primary key. |
| `title` | Safe display title, 1-160 characters. No control characters, prompts, raw source text, or provider payloads. |
| `state` | Closed set `published`, `needs_review`, `archived`. Members may read only `published` pages in P11 v1. |
| `current_revision_id` | Nullable FK to `wiki_revisions.id`; null until first publish. Updated only by the publish service or redaction invalidation service. |
| `created_at`, `updated_at` | Service timestamps. |

Indexes and constraints: index `(state, updated_at DESC)`; check page state enum; check title length. `archived` is reserved for a later route; P11 v1 does not implement archive/delete.

`wiki_revisions`

| Field | Rule |
| --- | --- |
| `id` | Opaque Wiki Revision id primary key. |
| `wiki_page_id` | Required FK to `wiki_pages.id`. |
| `revision_number` | Positive integer, unique per Wiki Page. |
| `title` | Copied safe title at publish time. |
| `body` | Curated wiki body text, 1-20000 characters. Not raw source storage and not raw Evidence storage. |
| `published_from_contribution_id` | Required FK to `wiki_contributions.id`; unique. |
| `published_by_user_id` | Nullable FK to `users.id` with `ON DELETE SET NULL`. |
| `published_at`, `created_at` | Service timestamps. |

Indexes and constraints: unique `(wiki_page_id, revision_number)`; unique `published_from_contribution_id`; index `(wiki_page_id, published_at DESC)`; check `revision_number >= 1`.

Revision rows are immutable after insert. Corrections create a new Wiki Contribution and a new Wiki Revision. Redaction or source/domain delete does not rewrite revision `title` or `body`.

`wiki_contributions`

| Field | Rule |
| --- | --- |
| `id` | Opaque Wiki Contribution id primary key. |
| `target_wiki_page_id` | Nullable FK to `wiki_pages.id`; null means publish creates a new page. |
| `created_by_user_id` | Required FK to `users.id`; owner for private draft/update/read routes. |
| `reviewed_by_user_id` | Nullable FK to `users.id` with `ON DELETE SET NULL`. |
| `title` | Safe draft title, 1-160 characters. |
| `body` | Curated draft body, 1-20000 characters. Not raw source storage. |
| `state` | Closed set `draft`, `submitted`, `published`, `rejected`, `blocked`. |
| `reviewer_note` | Nullable safe reviewer note, max 500 characters. No prompts, source text, provider payloads, stack traces, paths, or private ids. |
| `created_at`, `updated_at`, `submitted_at`, `reviewed_at` | Service timestamps. |

Indexes and constraints: index `(created_by_user_id, updated_at DESC)`; index `(state, updated_at DESC)`; index `(target_wiki_page_id, updated_at DESC)`; check contribution state enum; check title/body/reviewer note lengths.

State rules:

```text
draft -> submitted
submitted -> published
submitted -> rejected
draft/submitted -> blocked when stored context is invalidated
published and rejected are terminal in P11 v1
blocked cannot publish until a later repair contract exists
```

`wiki_contribution_evidence_refs`

| Field | Rule |
| --- | --- |
| `id` | Opaque contribution evidence-ref id primary key. |
| `wiki_contribution_id` | Required FK to `wiki_contributions.id` with `ON DELETE CASCADE`. |
| `conversation_turn_evidence_ref_id` | Required FK to `conversation_turn_evidence_refs.id`. Public DTOs expose this as an approved turn-scoped `evidenceRefId` only after authz validation. |
| `ref_order` | Positive integer order within the contribution. |
| `citation_label` | Nullable safe citation label copied from the turn evidence ref when active. |
| `source_label` | Nullable safe Source Document display label copied from the turn evidence ref when active. |
| `state` | Closed set `active`, `invalidated`. |
| `invalidated_at` | Nullable service timestamp. |
| `created_at` | Service timestamp. |

Indexes and constraints: unique `(wiki_contribution_id, ref_order)`; unique `(wiki_contribution_id, conversation_turn_evidence_ref_id)`; check `ref_order >= 1`; check ref state enum; check `(state = 'active' AND invalidated_at IS NULL) OR (state = 'invalidated' AND invalidated_at IS NOT NULL)`.

P11 tables do not persist raw Evidence excerpts, raw source text, raw assistant answers, prompts, provider payloads, raw LightRAG hits, storage paths, runtime targets, Docker targets, stack traces, credentials, or private Source Block ids. `conversation_turn_evidence_ref_id` may be stored for backend traceability, but audit target ids and public DTOs must not expose it as a private audit target.

## P11 Redaction And Invalidation Rules

When source/domain delete or chat redaction affects a `conversation_turn_evidence_refs` row referenced by P11:

1. Run invalidation before source/domain rows needed for lookup are removed where possible.
2. Set matching `wiki_contribution_evidence_refs.state = invalidated` and `invalidated_at = now`.
3. Set draft or submitted `wiki_contributions.state = blocked` when any active contribution ref becomes invalidated.
4. Published `wiki_revisions` remain immutable.
5. If the current revision for a Wiki Page was published from a contribution with an invalidated ref, set `wiki_pages.state = needs_review`.
6. Member page reads omit `needs_review` and `archived` pages.
7. Public APIs never return invalidated evidence labels as usable citations.

Repair/revalidation of blocked contributions and `needs_review` pages is deferred until a later contract patch.

## P8 Audit Events And Trace Correlation

P8 adds audit truth, request/operation correlation, and private chat trace correlation only. It does not add query logs, content tracing, audit export/delete, audit retention workers, generic event warehouses, Logs/Usage UI, cost accounting, or member-visible audit surfaces.

Correlation id rules:

- `request_id` is server-generated for every API request and is safe for logs, audit filters, and the canonical API error envelope.
- `domain_operations.request_id` and `source_preparation_operations.request_id` persist the request id that created the operation. Worker logs and worker-written audit rows use the persisted origin request id plus the safe operation id. A worker may generate its own request id only for worker-initiated work with no persisted origin and must not overwrite an existing origin value.
- Source indexing does not gain a new operation table in P8. Index retry/cancel/log correlation uses `source_documents.id` plus existing `source_documents.index_request_id`.
- P7 `client_request_id` remains the user-supplied idempotency key for conversation turns. It is not a server trace id.
- `trace_id` is generated for new chat turn execution only, persisted on `conversation_turns`, reused on idempotent replay, and may be copied into logs/traces/audit rows for turn-related operations. Admin mutations correlate through `request_id`, audit event id, and target id; they do not get broad trace ids in P8.

`audit_events`

| Field | Rule |
| --- | --- |
| `id` | Opaque audit event UUID primary key. |
| `event_name` | Closed `AuditEventName`, max 80 characters. |
| `actor_kind` | Closed set `public`, `member`, `administrator`, `worker`, `system`. |
| `actor_user_id` | Nullable FK to `users.id` with `ON DELETE SET NULL`; null for public, worker, and system events. |
| `target_kind` | Nullable safe target kind, max 40 characters. |
| `target_id` | Nullable safe target id, max 128 characters. |
| `request_id` | Nullable server request id or persisted origin request id, max 80 characters. |
| `trace_id` | Nullable private trace id, max 80 characters. |
| `outcome` | Closed set `succeeded`, `failed`, `denied`. |
| `safe_error_code` | Nullable safe error code, max 64 characters. |
| `metadata_json` | Nullable service-validated safe flat JSON object, serialized length <= 4096 bytes. |
| `created_at` | Service timestamp. |

Indexes: `(created_at DESC)`, `(event_name, created_at DESC)`, `(actor_user_id, created_at DESC)`, `(target_kind, target_id, created_at DESC)`, `request_id`, and `trace_id`.

`AuditEventName` values for P8 v1:

```text
runtime_settings.provider_config_rotated
runtime_settings.model_profile_created
runtime_settings.model_profile_updated
runtime_settings.model_profile_deleted
runtime_settings.defaults_updated

domain.created
domain.started
domain.stopped
domain.delete_queued
domain.delete_succeeded
domain.delete_failed

source.uploaded
source.preparation_retried
source.preparation_cancelled
source.deleted

source.index_retry_queued
source.index_cancelled

chat.turn_redacted

audit_events.read
diagnostics.read

security.admin_route_denied

wiki.contribution_created
wiki.contribution_updated
wiki.contribution_submitted
wiki.contribution_published
wiki.contribution_rejected
wiki.contribution_blocked
wiki.page_invalidated
```

Audit metadata rules:

- `metadata_json` is a flat object only.
- Keys must be allowlisted for the event name.
- Values may be strings up to 200 characters, integers, booleans, or null.
- Allowed P8/P11 v1 keys are `operationType`, `operationStatus`, `sourceState`, `indexState`, `turnStatus`, `stopReason`, `redactedTurnCount`, `diagnosticKind`, `lineCount`, `truncated`, `limit`, `elapsedMs`, `wikiContributionState`, `wikiPageState`, `revisionNumber`, and `evidenceRefCount`.
- Forbidden metadata includes username, email, filename, title, display name, raw request body, prompt, user question, assistant answer, source text, evidence excerpt, provider payload, runtime target, storage target, stack trace, credential material, private Source Block ids, private evidence ref ids, provider request ids, runtime/container/private controller ids, and browser-supplied targets.

Allowed target ids:

- `domain` -> `domains.id`
- `source_document` -> `source_documents.id`
- `domain_operation` -> `domain_operations.id`
- `source_preparation_operation` -> `source_preparation_operations.id`
- `conversation_turn` -> `conversation_turns.id` only for redaction accountability
- `wiki_contribution` -> `wiki_contributions.id`
- `wiki_page` -> `wiki_pages.id`
- `wiki_revision` -> `wiki_revisions.id` only for publish accountability

Forbidden target ids include `source_blocks.id`, `conversation_turn_evidence_refs.id`, `wiki_contribution_evidence_refs.id`, provider request ids, runtime/container/private controller ids, storage paths, runtime URLs, and external trace/provider ids.

Audit write rules:

- `AuditService` is the only application writer for `audit_events`.
- There is no update, delete, export, or retention route in P8.
- Protected admin/security mutations record audit rows in the same database transaction as the product state change.
- If an audit write fails for a protected admin/security mutation, the mutation is rolled back and the API returns a safe failure. Logs may record `safe_error_code=audit_unavailable` with no raw exception text.
- Read-only audit and diagnostics reads record `audit_events.read` or `diagnostics.read` before returning. API-001 may hide `audit_events.read` rows by default unless the caller explicitly filters for them.
- Public unauthenticated login/auth failures are safe-log only. Authenticated Members denied on admin routes emit `security.admin_route_denied`.
- P8 v1 does not persist or log raw IP, raw user agent, or derived IP/user-agent fingerprints.

P8 extends `conversation_turns` with private trace correlation:

| Field | Rule |
| --- | --- |
| `trace_id` | Nullable server-generated string, max 80 characters; created for new chat turn execution and used only for logs, traces, and audit correlation. |

Existing rows migrate with `trace_id = null`. Conversation API DTOs and SSE events must not expose `trace_id` in P8. Idempotent replay reuses the persisted turn `trace_id` when present and does not call provider, LightRAG, or retrieval just to create trace data.
