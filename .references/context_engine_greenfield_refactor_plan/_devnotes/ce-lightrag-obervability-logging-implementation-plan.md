# Context Engine × LightRAG
## Lean document-processing observability and logging implementation plan

**Audience:** junior developers, coding agents, reviewers

**Decision status:** recommended implementation baseline

**Review basis:** LightRAG `main` source tree and official documentation inspected on 2026-06-28. Relevant source areas: `lightrag/api/routers/document_routes.py`, `lightrag/pipeline.py`, `lightrag/lightrag.py`, `lightrag/utils.py`, `lightrag/api/routers/query_routes.py`, and `docs/FileProcessingPipeline.md`.

---

## 1. Purpose

Implement a small, reliable observability layer for Context Engine document processing and LightRAG semantic retrieval.

This plan deliberately does **not** copy LightRAG's internal logging design. Context Engine must own the product workflow, authorization, durable status, user-facing activity, and audit evidence. LightRAG remains a remotely operated semantic-index and retrieval provider.

### Goals

1. A user can see the trustworthy state of a document they are allowed to see.
2. An administrator can diagnose a failed upload, index, retrieval, lifecycle action, or query without shell access in common cases.
3. A developer can correlate a browser request, Context Engine job, external LightRAG track, and safe provider diagnostic excerpt.
4. A restart, retry, worker crash, or LightRAG restart cannot erase the authoritative Context Engine record of what happened.
5. The system remains a modular monolith: Next.js + FastAPI + PostgreSQL + Redis/arq + existing object storage + one LightRAG deployment per domain.
6. No raw document body, model prompt, model completion, secret, bearer token, or unrestricted provider log is written into application audit records.

### Non-goals for Lean V1

- No ELK/OpenSearch logging stack.
- No separate event bus, telemetry service, or observability microservice.
- No generic `events` table containing every state transition.
- No direct browser-to-LightRAG calls.
- No browser access to Docker, mounted volumes, LightRAG logs, or Langfuse.
- No duplicate file parsing in LightRAG after Context Engine has already produced the canonical parsed document.
- No second semantic index, vector store, or fallback retrieval path.
- No local summaries or exact-quote feature.
- No per-token persistence during streamed answers.

---

## 2. Executive architecture decision

### Adopt from LightRAG

| LightRAG capability | Context Engine use |
|---|---|
| Asynchronous document submission with a returned `track_id` | Store it as an external provider reference on the existing Context Engine job. |
| Per-document status and error reporting | Poll through the backend and map to the Context Engine status contract. |
| Explicit cancellation and destructive-operation guards | Use equivalent job cancellation and per-domain operation locks in Context Engine. |
| Health endpoint and document status endpoints | Use for provider readiness checks and reconciliation. |
| Retrieval references returned before streamed response tokens | Normalize into Context Engine evidence objects before synthesis begins. |
| Rotating operational logs and optional timing lines | Treat as diagnostic input only; never as product state. |

### Do not adopt from LightRAG

| LightRAG behavior | Why Context Engine must not depend on it |
|---|---|
| Shared workspace pipeline `busy`, `request_pending`, cancellation flags, and message history | It is runtime coordination state, not a user-scoped durable operation model. A new run clears the message history. |
| Raw text log files as the audit trail | Plain-text logs are unstructured, can omit successful high-frequency routes, and are unsuitable for authorization or retention policy. |
| FastAPI `BackgroundTasks` as the durable work queue | It ties work ownership to the serving process. Context Engine already has Redis/arq for durable worker execution. |
| LightRAG raw-file parsing as the canonical parse path | It duplicates Context Engine's Docling/Reducto-to-canonical-document pipeline and weakens provenance. |
| LightRAG authentication as the user authorization boundary | It has no Context Engine domain membership or product permission semantics. |
| LightRAG query response as the complete evidence contract | Context Engine must attach its own source navigation and structural metadata to evidence. |

### One-sentence rule

**PostgreSQL is authoritative for Context Engine state; LightRAG is authoritative only for the current external semantic-index operation it reports.**

---

## 3. What LightRAG currently does end to end

This section describes the observed LightRAG path so implementers understand what is being integrated and what is intentionally isolated.

### 3.1 Native LightRAG document path

```text
Client
  -> POST /documents/upload, /documents/text, or /documents/texts
  -> validates input / duplicate / parser or chunk configuration
  -> creates a LightRAG track ID
  -> FastAPI BackgroundTask starts indexing
  -> enqueue document records in LightRAG doc-status storage
  -> pipeline claims workspace pipeline_status busy lock
  -> parse stage
  -> analyze stage
  -> chunk / entity / relationship / embedding / storage writes
  -> document status becomes processed or failed
  -> caller polls track status and/or pipeline status
```

Observed contracts:

- Upload/text endpoints return before indexing completes and return a `track_id`.
- Document statuses are exposed by track status and paginated document APIs.
- The processing pipeline maintains a workspace-scoped `pipeline_status` map with values such as `busy`, `job_start`, document counts, request-pending state, cancellation flags, `latest_message`, and a message history.
- A single pipeline loop coordinates documents for a workspace. Uploads may set a request-pending flag while the loop is already busy; scan and destructive operations can block concurrent ingestion.
- Processing includes parse, analysis, chunking, entity/relation extraction, and storage updates.
- The file-processing subsystem has multiple parser options and independent stage concurrency controls.

### 3.2 Native LightRAG document observability surfaces

| Surface | Answers | Retention / durability | Appropriate Context Engine use |
|---|---|---:|---|
| `track_id` | Which async LightRAG submission did Context Engine create? | Provider record | Store as `external_track_id` on a job. |
| Document status | Was each provider document pending, parsing, analyzing, processing, processed, or failed? | Provider record | Poll and map to Context Engine status. |
| Pipeline status | Is the provider workspace busy? What is its latest message? Was cancel requested? | Runtime coordination state | Health and admin diagnostics only. |
| Pipeline history | What recent progress messages did the running provider pipeline emit? | Reset / bounded runtime history | Do not persist verbatim. Present a safe latest excerpt to admins only. |
| Application logs | What did provider code log, warn, or traceback? | File/stdout rotation | Bounded, redacted admin diagnostic tail only. |
| Optional performance-timing logs | Which instrumented paths emitted timings? | Plain log line only | Do not parse as primary metrics. Use Context Engine timings instead. |
| Query response and references | Which provider references and streamed tokens were returned? | Response lifetime | Normalize into Context Engine evidence and query log fields. |

### 3.3 Native LightRAG query path

```text
Client
  -> POST /query or /query/stream
  -> LightRAG aquery_llm
  -> graph/vector retrieval and LLM synthesis
  -> references assembled
  -> non-stream result OR NDJSON stream
       first message: references
       subsequent messages: response chunks
       final/problem message: error, if any
```

The LightRAG query router can include reference metadata and optionally chunk content. Context Engine should not expose provider chunk content directly as a product primitive. It should map provider references to its own `EvidenceItem` with document title, source path, structural location, and stable local reference ID.

---

## 4. Review findings

### Finding 1 — LightRAG has useful status APIs but no complete product-operation model

LightRAG gives a track ID, document statuses, a pipeline snapshot, cancellation indicators, and error text. Those are enough to operate its own server but not enough to answer product questions such as:

- Which Context Engine user started this work?
- Which document version and domain does it represent?
- Which retry attempt is this?
- What user-visible operation should show it?
- Did Context Engine parsing succeed before LightRAG was called?
- Was the provider result reconciled after a worker restart?
- What lifecycle action changed the domain around the same time?

**Decision:** Map provider status to Context Engine jobs. Do not expose provider state as the primary API contract.

### Finding 2 — Pipeline state is coordination state, not audit history

The provider’s workspace pipeline state uses shared flags and a lock to coordinate an active processing loop. It clears progress history at the start of a new run and coalesces later enqueue requests through a request-pending flag.

**Risk if copied:** A user could see another user’s unrelated workload, lost history after a new run, or misleading “complete” state after a process restart.

**Decision:** Context Engine stores current state in its existing document/job/operation rows. It keeps only a small capped diagnostic snapshot on the job, not an unbounded event history.

### Finding 3 — Plain-text logs are diagnostic output, not telemetry

LightRAG’s logger writes console output and a rotating file with a conventional time/name/level/message formatter. It can filter successful high-frequency document, health, and pipeline-status access logs. Its performance helper emits ordinary log lines only when enabled.

**Risk if copied:** No consistent JSON schema, weak correlation, incomplete request accounting, accidental content leakage, and fragile log parsing.

**Decision:** Context Engine emits structured JSON logs to stdout, records business state in PostgreSQL, and treats provider logs as a privileged diagnostic supplement.

### Finding 4 — LightRAG’s rich parser pipeline would duplicate Context Engine parsing

LightRAG supports parser routing, multimodal analysis, parser-specific configuration, and parser-stage concurrency. Context Engine already needs one canonical document model from Docling or Reducto so downstream indexing, evidence navigation, images, tables, and structural metadata stay stable.

**Decision:** Context Engine parses files once, normalizes them once, then sends a deterministic text representation to LightRAG through the text insertion route. Do not send the original binary to LightRAG in Lean V1.

### Finding 5 — Provider lifecycle contention must be visible and explicit

LightRAG protects scans, destructive work, and processing through workspace coordination flags. The underlying concern is valid: mutation operations must not race with indexing.

**Decision:** Context Engine has separate domain-level operation locking for lifecycle/delete and document-level uniqueness for active ingest. The API returns a clear `409 domain_operation_in_progress` rather than relying on provider busy messages.

### Finding 6 — Query streaming needs a Context Engine boundary

LightRAG streams NDJSON and may emit references first, tokens later, and an error after partial output. It logs query errors but does not provide a Context Engine-level request, actor, permission, evidence-quality, provider latency, and synthesis trace model.

**Decision:** Context Engine owns the browser SSE contract. It requests or receives provider retrieval output behind the server boundary, maps evidence, then streams its own typed events.

---

## 5. Target Context Engine flow

### 5.1 Document processing

```text
Browser / admin portal
  -> Context Engine API
     -> permission check + request_id
     -> object storage original file
     -> documents row + ingest job row + operation row
     -> arq enqueue(document_id, job_id)

Context Engine worker
  -> acquire document execution lease
  -> parse through parser registry (Docling or Reducto)
  -> normalize to canonical document model
  -> persist source chunks, structural locations, images/table metadata
  -> build deterministic LightRAG text payload
  -> LightRAG adapter POST /documents/texts
  -> store external_track_id on job
  -> poll provider track status with bounded backoff
  -> map provider status to job/document state
  -> verify provider documents processed
  -> mark document READY

Admin-only diagnostics
  -> Context Engine API
  -> current job / operation / provider health
  -> bounded redacted provider log tail only when needed
```

### 5.2 Query processing

```text
Browser
  -> POST Context Engine chat turn
  -> Context Engine authentication / domain authorization
  -> create request_id and query_log row
  -> LightRAG semantic retrieval + local structural/BM25 route + reranker
  -> normalize and permission-filter EvidenceItem list
  -> begin answer stream only after mapped evidence exists
  -> persist aggregate latency, provider outcome, evidence count, trace reference
  -> stream typed Context Engine SSE events to browser
```

### 5.3 Deletion and lifecycle

```text
Admin request
  -> permission + audit record
  -> domain operation job obtains per-domain exclusive lease
  -> stop / start / delete controller action outside FastAPI request path
  -> delete provider document or whole domain artifacts as appropriate
  -> persist final state and a safe failure reason
  -> release lease
```

---

## 6. Ownership model

| Concern | Owner | Source of truth | UI audience |
|---|---|---|---|
| Original upload | Context Engine | Object storage + `documents` | authorized users |
| Parsed canonical document and source chunks | Context Engine | PostgreSQL/object storage | authorized users |
| Current document product state | Context Engine | `documents` + active `jobs` | authorized users |
| Retry attempt and external track ID | Context Engine | `jobs` | admin and document owner where appropriate |
| Domain lifecycle desired state | Context Engine | domain/lifecycle rows | admin |
| LightRAG vector/graph/semantic retrieval | LightRAG | provider domain storage | never direct browser access |
| User/role/domain authorization | Context Engine | permissions/membership | all routes |
| Business audit | Context Engine | `audit_logs` | admin |
| Query runtime summary | Context Engine | `query_logs` | admin |
| Deep LLM/RAG trace | Langfuse, admin-only, optional | Langfuse | admin |
| Raw provider logs | LightRAG/container | log file / stdout | emergency admin diagnostics only |

---

## 7. Lean data model

Do **not** create a generic events table. Reuse existing logical tables and add focused fields.

### 7.1 `documents` additions

```text
processing_state        enum: uploaded | processing | ready | failed | cancelled | deleting | deleted
processing_stage        enum nullable: queued | parsing | normalizing | assets | chunking | indexing | verifying
processing_detail       varchar(300) nullable, safe user-readable sentence
last_job_id             uuid nullable
last_error_code         varchar(80) nullable
last_error_summary      varchar(500) nullable, redacted
ready_at                timestamptz nullable
```

Rules:

- `processing_state` is the only document-status field consumed by general UI.
- `processing_stage` exists only while state is `processing` or `deleting`.
- Do not store raw traceback, document content, model response, or provider log lines in these columns.
- Preserve existing structural metadata and canonical `SourceChunk` tables as the evidence source.

### 7.2 Existing `jobs` / ingestion-job additions

Use the project’s existing job table. Add fields only if absent.

```text
id                      uuid primary key
kind                    enum: ingest_document | delete_document | domain_start | domain_stop | domain_delete
state                   enum: queued | running | waiting_provider | succeeded | failed | cancelled
attempt                 integer default 1
max_attempts            smallint default 3
request_id              uuid
actor_id                uuid nullable
workspace_or_domain_id  uuid
document_id             uuid nullable
external_provider       varchar(40) nullable       -- 'lightrag'
external_track_id       varchar(160) nullable
external_status         varchar(80) nullable
provider_last_seen_at   timestamptz nullable
next_poll_at            timestamptz nullable
stage                   same stage enum as document
progress_current        integer nullable
progress_total          integer nullable
error_code              varchar(80) nullable
error_summary           varchar(500) nullable
safe_diagnostics        jsonb default '{}'
started_at              timestamptz nullable
finished_at             timestamptz nullable
```

`safe_diagnostics` is capped data, for example:

```json
{
  "provider_http_status": 503,
  "provider_error_type": "timeout",
  "last_provider_message": "index service unavailable",
  "last_provider_status": "PROCESSING"
}
```

Limits:

- Maximum 10 keys.
- Maximum 300 characters per string.
- Never include credentials, raw prompts, generated answer text, full source chunk text, request headers, or stack traces.

### 7.3 Existing `operations` contract

Keep operations separate from jobs.

```text
id, kind, state, actor_id, target_type, target_id,
summary, started_at, finished_at, job_id nullable
```

- An **operation** is the human-readable activity: “Indexed Benefits Handbook v4.”
- A **job** is the implementation execution: attempts, provider track, polling, retry, timing.
- A one-to-one relationship is sufficient in Lean V1. Keep the models separate because their permissions, language, and retention differ.

### 7.4 Existing `query_logs` additions

```text
request_id
user_id
domain_id
conversation_id nullable
retrieval_profile
lightrag_latency_ms nullable
local_retrieval_latency_ms nullable
rerank_latency_ms nullable
synthesis_latency_ms nullable
total_latency_ms
evidence_count
answer_status              completed | interrupted | failed | grounded_refusal
provider_outcome           ok | degraded | unavailable
evidence_quality           pass | insufficient | mixed
trace_id nullable
```

Rules:

- Query text remains optional and follows current privacy policy.
- Do not store answer text by default.
- Store an opaque Langfuse trace ID only when tracing is configured.

### 7.5 Existing `audit_logs`

Continue using native audit records for:

- upload acceptance/rejection,
- retry/cancel/delete request,
- domain start/stop/delete,
- viewing raw provider diagnostics,
- provider configuration change,
- permission-denied admin access.

Audit metadata holds IDs and safe reasons, not raw content.

---

## 8. Canonical status contract

### 8.1 Public document states

```text
UPLOADED
PROCESSING
READY
FAILED
CANCELLED
DELETING
DELETED
```

### 8.2 Processing stages

```text
QUEUED
PARSING
NORMALIZING
ASSETS
CHUNKING
INDEXING
VERIFYING
```

Optional future wiki-curation stages may be reserved but must not be scheduled in Lean V1:

```text
PLANNING
AWAITING_REVIEW
COMPILING
```

### 8.3 Allowed transitions

```text
UPLOADED -> PROCESSING/QUEUED
PROCESSING/QUEUED -> PROCESSING/PARSING
PROCESSING/PARSING -> PROCESSING/NORMALIZING
PROCESSING/NORMALIZING -> PROCESSING/ASSETS or PROCESSING/CHUNKING
PROCESSING/ASSETS -> PROCESSING/CHUNKING
PROCESSING/CHUNKING -> PROCESSING/INDEXING
PROCESSING/INDEXING -> PROCESSING/VERIFYING
PROCESSING/VERIFYING -> READY
any nonterminal -> FAILED
any cancellable nonterminal -> CANCELLED
READY | FAILED | CANCELLED -> DELETING -> DELETED
FAILED -> PROCESSING/QUEUED only through an explicit retry operation
```

### 8.4 Mapping LightRAG provider status

Keep raw provider status privately on the job; publish the normalized Context Engine stage.

| LightRAG signal | Context Engine state/stage |
|---|---|
| submission accepted / track ID returned | `PROCESSING / INDEXING` |
| `PENDING` | `PROCESSING / INDEXING` |
| `PARSING`, `ANALYZING`, or `PROCESSING` | `PROCESSING / INDEXING` |
| provider `PROCESSED` for all documents linked to the track | `PROCESSING / VERIFYING` |
| provider verification succeeds | `READY` |
| provider `FAILED` | `FAILED` with mapped safe error code |
| provider track absent beyond reconciliation window | `FAILED` as `provider_track_lost` after retry policy is exhausted |
| provider reports cancellation after Context Engine cancellation | `CANCELLED` |

Do not expose LightRAG’s internal status names as the public API. They will evolve independently.

---

## 9. LightRAG adapter boundary

Create one adapter. It is the only code allowed to know LightRAG endpoints, track IDs, status strings, and provider response shapes.

### 9.1 Module layout

```text
backend/app/integrations/lightrag/
  client.py               # authenticated HTTP client and timeout policy
  models.py               # provider-only Pydantic models
  adapter.py              # Context Engine interface implementation
  mapper.py               # provider status/reference -> CE mapping
  diagnostics.py          # safe, bounded admin diagnostics
  errors.py               # typed integration errors
  tests/
```

### 9.2 Interface

```python
class SemanticIndexProvider(Protocol):
    async def submit_document(
        self,
        *,
        domain_id: UUID,
        document_id: UUID,
        version_id: UUID,
        canonical_text: str,
        source_identity: str,
    ) -> ProviderSubmission: ...

    async def get_track_status(
        self,
        *,
        domain_id: UUID,
        external_track_id: str,
    ) -> ProviderTrackStatus: ...

    async def get_health(self, *, domain_id: UUID) -> ProviderHealth: ...

    async def delete_document(
        self,
        *,
        domain_id: UUID,
        source_identity: str,
    ) -> None: ...

    async def semantic_retrieve(
        self,
        *,
        domain_id: UUID,
        query: str,
        options: RetrievalOptions,
    ) -> ProviderRetrieval: ...
```

### 9.3 Submission rule

Context Engine calls LightRAG `/documents/texts`, not raw-file upload, after canonical parsing succeeds.

Use a deterministic provider source identity:

```text
context-engine/<domain-id>/<document-id>/<version-id>.md
```

The deterministic payload should preserve safe structural anchors, for example headings and source-chunk identifiers in a hidden or non-user-visible metadata convention. The adapter must have an integration test proving that the selected LightRAG version accepts the identity and returns it through document/reference status.

### 9.4 Timeout and retry rules

| Operation | Request timeout | Retry owner | Retry behavior |
|---|---:|---|---|
| submit text | 30 seconds | Context Engine worker | maximum 3 attempts, exponential backoff with jitter |
| get track status | 10 seconds | Context Engine poll worker | retry transient errors; set next poll time |
| health | 5 seconds | controller/health worker | no immediate user retry loop |
| delete provider document | 30 seconds | domain/document delete job | retry only idempotent not-found/timeout cases |
| semantic retrieval | product timeout budget | chat-turn service | one bounded provider call; no hidden local semantic fallback |

Never retry a non-idempotent provider submission without a deterministic identity and a preflight duplicate/reconciliation check.

---

## 10. Observability design

### 10.1 Four layers, four uses

| Layer | Mechanism | Purpose | Retention | Audience |
|---|---|---|---|---|
| Product state | documents/jobs/operations rows | Show accurate activity and recover work | product retention | scoped user / admin |
| Audit | existing `audit_logs` | Who did an administrative or security-sensitive action | audit retention | admin |
| Runtime logs | structured JSON to stdout | Diagnose code and infrastructure | platform retention | operators/admins |
| RAG trace | Langfuse, optional | Inspect retrieval/synthesis chain and model timing | tracing retention | admin |

### 10.2 Required structured log schema

Every FastAPI request and arq job log includes:

```json
{
  "timestamp": "2026-06-28T20:15:00.000Z",
  "level": "INFO",
  "service": "context-engine-api",
  "event": "document.index.submit",
  "request_id": "uuid",
  "job_id": "uuid",
  "operation_id": "uuid",
  "domain_id": "uuid",
  "document_id": "uuid",
  "actor_id": "uuid-or-null",
  "external_track_id": "safe-reference-or-null",
  "duration_ms": 183,
  "outcome": "success"
}
```

Rules:

- `event` uses stable dot-separated names.
- IDs appear when known; fields may be omitted before creation.
- Logs are JSON stdout only in app containers. Let the container/platform manage retention.
- Raw source content, prompts, completions, authorization headers, API keys, and cookies are forbidden fields.
- A logging helper should redact known secret keys and cap string field length.

### 10.3 Required event names

```text
document.upload.accepted
document.job.enqueued
document.parse.started
document.parse.completed
document.normalize.completed
document.index.submit.started
document.index.submit.accepted
document.index.poll
document.index.verified
document.index.failed
document.cancel.requested
document.delete.started
document.delete.completed
lightrag.health.checked
lightrag.diagnostics.viewed
chat.turn.started
chat.retrieval.completed
chat.evidence.mapped
chat.synthesis.started
chat.turn.completed
chat.turn.failed
domain.operation.started
domain.operation.completed
domain.operation.failed
```

### 10.4 Provider diagnostics policy

Provider logs are useful only for diagnosis after a safe job record identifies a problem.

Implement one admin-only diagnostic endpoint:

```text
GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag?tail=200
```

Rules:

- It is implemented through the lifecycle/controller worker, never an arbitrary filesystem path from the browser.
- Maximum 200 lines and 64 KiB response.
- Redact bearer tokens, API keys, cookies, connection strings, and values matching configured secret patterns.
- Remove/replace document text that exceeds a small per-line threshold.
- It may return unavailable when a domain is stopped.
- Each view creates `audit_logs` entry `lightrag.diagnostics.viewed`.
- It is not persisted in PostgreSQL by default.

### 10.5 Langfuse policy

Use Langfuse for LLM/RAG observability only after the native state contract works.

- One Langfuse trace per Context Engine chat turn.
- Include request ID, domain ID, retrieval profile, model profile, latency, evidence count, and outcome.
- Do not send raw source chunks or full document body.
- Keep traces admin-only. Browser receives no Langfuse credentials or direct URL.
- Native `audit_logs`, `jobs`, `operations`, and `query_logs` remain the authoritative system record.

---

## 11. API contract

### 11.1 User-scoped document status

```text
GET /api/v1/domains/{domain_id}/documents/{document_id}/status
```

Response:

```json
{
  "document_id": "uuid",
  "state": "processing",
  "stage": "indexing",
  "detail": "Submitting canonical document to semantic index.",
  "progress": {"current": null, "total": null},
  "updated_at": "2026-06-28T20:15:00Z",
  "can_retry": false,
  "can_cancel": true
}
```

Never include provider URLs, raw track IDs, file paths, stack traces, raw logs, or another user’s documents.

### 11.2 Admin job detail

```text
GET /api/v1/admin/jobs/{job_id}
```

Includes safe fields:

```json
{
  "id": "uuid",
  "kind": "ingest_document",
  "state": "waiting_provider",
  "attempt": 1,
  "domain_id": "uuid",
  "document_id": "uuid",
  "stage": "indexing",
  "external_provider": "lightrag",
  "external_status": "PROCESSING",
  "provider_last_seen_at": "2026-06-28T20:15:00Z",
  "error_code": null,
  "error_summary": null,
  "safe_diagnostics": {"provider_http_status": 202},
  "started_at": "...",
  "finished_at": null
}
```

### 11.3 Admin operational lists

```text
GET /api/v1/admin/operations
GET /api/v1/admin/jobs
GET /api/v1/admin/domains/{domain_id}/health
GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag
POST /api/v1/admin/jobs/{job_id}/retry
POST /api/v1/admin/jobs/{job_id}/cancel
```

### 11.4 Frontend transport

- Poll a visible document status every 3–5 seconds while it is `processing`.
- Stop polling when terminal.
- Do not poll provider APIs from the browser.
- Use the existing typed chat SSE contract for chat. Do not pass LightRAG’s NDJSON protocol through unchanged.

---

## 12. Worker and locking design

### 12.1 Jobs

Use existing Redis/arq workers.

```text
process_document(job_id, document_id)
poll_lightrag_track(job_id)
retry_ingest(job_id)
delete_document(job_id, document_id)
operate_domain(job_id, domain_id, action)
reconcile_lightrag_tracks(domain_id)
```

### 12.2 Leases

Use only two lock scopes:

1. **Document active-ingest uniqueness:** one active ingest job per `document_id` and version. Enforce with a partial unique database index or transaction check.
2. **Domain mutation lease:** one start/stop/delete/purge action per domain. Use the existing Redis lock pattern with a TTL and persisted job ownership.

Do not use a global pipeline lock. Independent documents may parse concurrently subject to worker limits.

### 12.3 Crash recovery

On worker start and every five minutes:

1. Find jobs in `running` or `waiting_provider` whose heartbeat is stale.
2. If a LightRAG track ID exists, poll it first.
3. If provider says processed, advance through verification.
4. If provider says failed, mark job failed with safe mapped reason.
5. If provider cannot be reached, retain `waiting_provider` until the job deadline.
6. If deadline expires, fail with `provider_unreachable` and permit a manual retry.

The reconciliation worker replaces any need to trust a process-local background task after Context Engine restarts.

---

## 13. Implementation phases

Each phase must be independently reviewable, testable, and mergeable. Do not start a later phase before the previous phase acceptance checks pass.

### Phase 0 — Freeze contracts and create architecture tests

**Goal:** Define one status vocabulary and one LightRAG adapter seam before implementation starts.

Tasks:

1. Add `docs/architecture/lightrag_observability.md` from this plan.
2. Create status enums and Pydantic response models in one shared backend module.
3. Add a provider adapter protocol with a fake in-memory implementation for tests.
4. Add an ADR: “Context Engine owns product operation state; LightRAG is an external semantic provider.”
5. Pin the tested LightRAG image/revision in deployment configuration.

Acceptance checks:

- No route imports a raw LightRAG HTTP client directly except the adapter package.
- Status transition unit tests reject invalid transitions.
- CI runs adapter contract tests against a fake provider.

### Phase 1 — Durable job and document state

**Goal:** Make document processing observable without depending on LightRAG logs.

Tasks:

1. Migrate existing documents/jobs tables with the focused fields in Section 7.
2. Add an active-ingest unique constraint.
3. Implement document state transition service; no route writes status columns directly.
4. Create operation rows alongside user-visible uploads/deletes.
5. Extend admin job detail and document status response.

Acceptance checks:

- Upload creates document, job, and operation records atomically.
- A failed parser results in `documents.processing_state = failed`, a safe error code, and a terminal job.
- Restarting API does not lose a queued job’s identity or status.
- Normal users cannot inspect global jobs or another user’s document status.

### Phase 2 — Structured Context Engine logging

**Goal:** Replace ad hoc application logs with safe correlation.

Tasks:

1. Add request-ID middleware; honor an incoming valid request ID or generate UUID.
2. Add job execution context that binds request/job/domain/document/actor IDs.
3. Configure JSON stdout logging for API and workers.
4. Add secret redaction and string-size capping.
5. Instrument the required event names in Section 10.3.
6. Keep current standard Python error stack logs only in container logs, not database fields.

Acceptance checks:

- API request, worker job, and LightRAG adapter call share `request_id` and `job_id`.
- Automated test proves `Authorization`, `api_key`, and `password` values are redacted.
- A snapshot test confirms log lines are valid JSON.

### Phase 3 — Canonical parser-to-index path

**Goal:** Parse once in Context Engine and submit only deterministic text to LightRAG.

Tasks:

1. Use parser registry to produce canonical document structure from Docling/Reducto.
2. Persist canonical source chunks and structural metadata before indexing.
3. Build deterministic LightRAG text payload from canonical document structure.
4. Establish `source_identity` convention and persist it on the document version/job.
5. Implement `submit_document` through `/documents/texts`.
6. On successful submission, save external provider and external track ID before enqueueing polling.

Acceptance checks:

- Original file is not uploaded to LightRAG in Lean V1.
- Retrying a job does not create an ambiguous duplicate provider document.
- Source identity maps back to one Context Engine document version.
- Parser completion is visible before indexing begins.

### Phase 4 — Track polling, mapping, cancellation, and reconciliation

**Goal:** Reliably complete or fail a job based on provider status.

Tasks:

1. Implement `get_track_status` response parsing and status mapper.
2. Add bounded backoff poll scheduling through arq.
3. Persist only safe provider status/error summary on the job.
4. Implement cancellation request; stop local scheduling and call provider cancellation only where supported.
5. Implement five-minute stale-job reconciliation.
6. Implement retry operation with a clear policy and audit entry.

Acceptance checks:

- A mocked `PENDING -> PROCESSING -> PROCESSED` track reaches `READY` only after verification.
- A mocked provider failure reaches terminal `FAILED` with safe error code.
- A provider timeout leaves the job recoverable, not falsely `READY`.
- Killing the worker during polling followed by restart reconciles the correct final state.

### Phase 5 — Query observability and evidence mapping

**Goal:** Make chat turns traceable without leaking content.

Tasks:

1. Add query request ID and extended query-log fields.
2. Route all LightRAG semantic calls through adapter `semantic_retrieve`.
3. Normalize provider references into Context Engine `EvidenceItem` records using local structural metadata.
4. Measure local retrieval, provider retrieval, rerank, synthesis, and total latency.
5. Log an aggregate query outcome once, at terminal completion/failure.
6. Add optional Langfuse trace adapter behind an environment flag.

Acceptance checks:

- Evidence exists before first answer token is emitted.
- A provider reference cannot display a document outside the requester’s permission scope.
- Query log contains latency/evidence count but no answer text by default.
- Partial stream error is represented as `answer_status = failed` with safe reason.

### Phase 6 — Admin diagnostics and operational UI

**Goal:** Give admins safe debugging capability without turning the product into a log viewer.

Tasks:

1. Build admin jobs list with filters: domain, state, kind, date, error code.
2. Build operation list separately from jobs.
3. Add domain health endpoint and UI state: healthy, degraded, unavailable, stopped.
4. Add bounded redacted LightRAG diagnostics endpoint and UI drawer.
5. Write audit entry when diagnostics are viewed.
6. Do not display raw logs, stack traces, secrets, or provider configuration to normal users.

Acceptance checks:

- Member direct navigation to admin observability routes returns forbidden/redirect behavior.
- Admin can identify job, provider track status, safe error, and a 200-line diagnostic tail.
- Any diagnostics fetch is audit logged.

### Phase 7 — Operational verification and launch gate

**Goal:** Prove the complete flow under realistic failures.

Tasks:

1. Add integration environment with Context Engine, Redis worker, PostgreSQL, test object storage, and pinned LightRAG.
2. Run test matrix in Section 14.
3. Add a lightweight runbook for failed indexing, stalled tracks, provider unavailable, and accidental duplicate submission.
4. Confirm retention and redaction settings with security review.

Acceptance checks:

- All critical failure scenarios have deterministic terminal state.
- No secret/raw content appears in API responses, database state fields, or structured logs.
- Document can be uploaded, processed, queried with evidence, deleted, and audited end to end.

---

## 14. Required test matrix

### Unit tests

- Status transition state machine.
- Provider status mapping.
- Diagnostic redactor.
- Retry eligibility.
- Deterministic source identity creation.
- Evidence reference mapping.
- Permission filtering of document/job/operation routes.

### Integration tests

| Scenario | Expected result |
|---|---|
| Successful small PDF | `UPLOADED -> PROCESSING -> READY`; source chunks and external track reference recorded. |
| Parser failure | `FAILED`; provider submission never occurs. |
| LightRAG submit timeout | Job remains retryable; no duplicate submission on retry. |
| LightRAG track reports failed | Job/document become `FAILED`; safe error exposed. |
| Worker killed during polling | Reconciliation resumes from provider track after worker restart. |
| Provider stopped mid-index | Job waits/retries within deadline then fails safely. |
| Duplicate upload | Deterministic 409/business error; no duplicate active job. |
| Delete while indexing | Domain/document operation lease prevents racing mutation; final state clear. |
| Member requests admin jobs | 403 or app forbidden state; no job data leaked. |
| Query stream provider error after partial tokens | Chat turn emits typed error; query log marked failed. |
| Sensitive content in provider error/log | Redacted in diagnostic response and JSON logs. |

### Load/operational test

For the target 5–10 concurrent users:

- Multiple reads/queries must continue while one admin indexes a document.
- Two independent documents can parse concurrently within configured worker capacity.
- Domain lifecycle/delete operation correctly blocks conflicting writes only in that domain.
- Provider polling is bounded and does not create one browser poll per provider poll.

---

## 15. Definition of done

The feature is complete only when all statements are true:

1. Every upload has a durable document row, job row, and operation row.
2. Every LightRAG submission is tied to one job through a stored external track ID.
3. A page refresh or API restart cannot lose the visible processing status.
4. LightRAG logs are not used to decide product state.
5. No browser talks directly to LightRAG.
6. No normal user can see global jobs, raw provider diagnostics, or another user’s document activity.
7. Document parsing occurs once in Context Engine before semantic indexing.
8. The chat stream is Context Engine SSE, with evidence mapped before synthesis output.
9. Query, job, operation, audit, and runtime logs have a shared request correlation ID where applicable.
10. Provider logs are bounded, redacted, audited, and admin-only.
11. All Section 14 tests pass against the pinned LightRAG version.

---

## 16. Implementation guardrails for coding agents

1. Do not add a queue, telemetry service, or database table unless named in this plan.
2. Do not call LightRAG from a route handler except through the adapter; durable work belongs to arq workers.
3. Do not write user-facing state directly from a log parser.
4. Do not use raw LightRAG status strings in frontend components.
5. Do not store document text, prompts, answers, bearer tokens, API keys, or full tracebacks in Postgres observability fields.
6. Do not add a local semantic fallback to a LightRAG error.
7. Do not change parsing output contracts downstream of the canonical document model.
8. Do not expose Docker/container paths, environment variables, provider endpoints, or raw logs through ordinary API responses.
9. Keep operations and jobs distinct even if the first implementation uses one operation per job.
10. Add or update tests whenever a provider status, parser, retry rule, or API response changes.

---

## 17. Reviewer checklist

Before approving each implementation PR, verify:

- Is the new state owned by Context Engine or incorrectly inferred from provider logs?
- Is the data needed by users, admins, developers, or all three? Is its route permission correct?
- Is raw content accidentally placed in a structured log, job JSON, or audit metadata?
- Does the task run durably in arq rather than FastAPI background execution?
- Does a crash/retry preserve idempotency and correlation?
- Can LightRAG evolve internally without forcing a frontend/API contract change?
- Is the new field/action essential for the stated Lean V1 requirements?

---

## 18. Source locations reviewed

Use these LightRAG locations when updating the pinned integration:

```text
lightrag/api/routers/document_routes.py
lightrag/pipeline.py
lightrag/lightrag.py
lightrag/utils.py
lightrag/api/routers/query_routes.py
docs/FileProcessingPipeline.md
docs/API_Document.md (or current API documentation equivalent)
env.example
```

Re-run the adapter contract suite whenever LightRAG version, parser configuration, document endpoint response model, track status schema, or reference schema changes.
