# F-008 / P8 Reconciled Design Gates

Status: review decision draft  
Feature: F-008 - Observability And Pilot Gate  
Date: 2026-07-06  
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `.devnotes/P7-post-impl-REVIEW/F-008-P8-readiness.md`.

It agrees with the preliminary review: P8 adds safe audit, logs, optional tracing, admin diagnostics, and pilot evidence without changing P1-P7 behavior. It is not implementation authority by itself. Before coding, patch:

- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/05-quality/observability.md`
- `specs/04-features/F-008-observability-pilot-gate/spec.md`
- `specs/04-features/F-008-observability-pilot-gate/plan.md`
- `specs/04-features/F-008-observability-pilot-gate/test-plan.md`
- `specs/04-features/F-008-observability-pilot-gate/acceptance.md`
- `specs/06-delivery/runbooks/pilot-launch.md`

No user override decisions were supplied beyond the preliminary review direction. The recommendations below are review decisions to accept through contract/spec patches before P8 implementation starts.

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`
- `specs/00-governance/constitution.md`
- `specs/01-product/roles-and-permissions.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/02-architecture/data-ownership.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-007-grounded-streaming-chat/acceptance.md`
- `specs/04-features/F-007-grounded-streaming-chat/implementation-log.md`
- `specs/04-features/F-008-observability-pilot-gate/spec.md`
- `specs/04-features/F-008-observability-pilot-gate/plan.md`
- `specs/04-features/F-008-observability-pilot-gate/tasks.md`
- `specs/04-features/F-008-observability-pilot-gate/test-plan.md`
- `specs/04-features/F-008-observability-pilot-gate/acceptance.md`
- `specs/05-quality/observability.md`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/test-strategy.md`
- `specs/05-quality/performance-and-resilience.md`
- `specs/06-delivery/release-and-rollbacks.md`
- `specs/06-delivery/runbooks/pilot-launch.md`
- `specs/07-traceability/feature-register.md`
- `.devnotes/P7-post-impl-REVIEW/F-008-P8-readiness.md`
- `.devnotes/P7-post-impl-REVIEW/ID-A.md`
- `.devnotes/P7-post-impl-REVIEW/ID-A-audit-events.md`
- `.devnotes/P7-post-impl-REVIEW/ID-A-safe-logging-context.md`
- `.devnotes/P7-post-impl-REVIEW/ID-A-optional-tracing-langfuse.md`
- `.devnotes/P7-post-impl-REVIEW/ID-A-admin-diagnostics.md`
- `.devnotes/P7-post-impl-REVIEW/ID-A-pilot-launch-gate.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`
- `.devnotes/P6-post-impl-REVIEW/F-007-P7-reconciled-design-gates.md`
- `pyproject.toml`
- `context_engine/models.py`
- `context_engine/api/routes.py`
- `context_engine/services/chat_turns.py`
- `tests/test_grounded_streaming_chat.py`
- `.references/context_engine_fullstack_impl_docs/phase_plan/P8_observability_pilot_gate.md`

## Product DNA Locks

- Use canonical product terms: Knowledge Domain, Source Document, Evidence, Citation, Conversation, Turn, Redaction, Runtime Node only when later features define it.
- P8 creates `audit_events`, `AuditEventName`, `AuditService`, structured JSON logs, request/log context, optional metadata-only tracing, optional admin diagnostics, and pilot launch evidence.
- P8 observes P1-P7. It does not change P1-P7 API behavior, SSE event names, retrieval behavior, redaction behavior, lifecycle state machines, source/index semantics, or browser contracts except for explicitly added P8 admin routes.
- Audit, logs, and traces are separate layers:
  - `audit_events` is admin/security accountability truth.
  - JSON stdout is diagnostic evidence.
  - optional Langfuse is timing/metadata debug only.
- Browser remains thin. It never sees or supplies private runtime targets, paths, URLs, provider payloads, LightRAG internals, prompts, source text, answers, or credentials.
- P8 does not create a second system of record: no `query_logs`, generic event warehouse, generic workflow engine, metrics stack, SIEM export, alerting system, custom dashboard, or content tracing.
- Tracing is disabled by default. If enabled, one isolated tracing module owns the external adapter and outages are ignored.
- Admin diagnostics are optional. If shipped, they are admin-only, backend-targeted, redacted, bounded, audited, and never path/URL driven by the browser.
- Pilot readiness is a proof package, not a production scale claim. The only approved scale target is 5-10 internal concurrent users until P8 records benchmark evidence.

## Recommended Build Shape

```text
FastAPI middleware / composition root
  -> request_id
  -> optional trace_id
  -> safe log context

Services and routes
  -> existing P1-P7 behavior
  -> call AuditService for approved admin/security transitions
  -> call safe_log helper for diagnostic records
  -> call tracing wrapper only through no-op/optional adapter

Postgres
  audit_events
    immutable admin/security accountability

  conversation_turns
    nullable trace_id only if DATA-001 accepts it
    no API/SSE exposure in P8

API additions
  GET /api/v1/admin/audit-events
  optional GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag

P8 verification
  migration + service + route tests
  P7 SSE regression
  secret/safety scan
  compose/private-runtime smoke when fixture exists
  full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact
  5-10 user expected-load test
  failure injection tests
```

## A. Schema/API Gates

### A1. `audit_events` columns, indexes, immutability?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Typed audit table plus bounded safe metadata | Filterable, testable, keeps audit truth in one place | Needs DATA-001 patch before code | `event_name`, `actor_kind`, `target_kind`, `metadata_json` |
| Generic append-only JSON event table | Fast to add and flexible | Becomes an event warehouse and leaks easily | `payload` only |
| Use JSON stdout as audit | No schema work | Violates QA-003: logs are not audit truth | log record |

Recommendation: Option 1.

Patch DATA-001 with:

```text
audit_events
  id                 String(36) primary key
  event_name         String(80) not null, closed AuditEventName
  actor_kind         String(24) not null
  actor_user_id      String(36) null FK users.id ON DELETE SET NULL
  target_kind        String(40) null
  target_id          String(128) null
  request_id         String(80) null
  trace_id           String(80) null
  outcome            String(16) not null: succeeded | failed | denied
  safe_error_code    String(64) null
  metadata_json      Text null, service-validated safe flat JSON
  created_at         DateTime not null
```

Indexes:

```text
index(created_at desc)
index(event_name, created_at desc)
index(actor_user_id, created_at desc)
index(target_kind, target_id, created_at desc)
index(request_id)
index(trace_id)
```

Rules:

```text
metadata_json max serialized length: 4096 bytes
metadata_json keys are allowlisted per AuditEventName
metadata_json values are scalar strings, integers, booleans, or null
no update route
no delete route
no export route in P8
AuditService is the only writer
```

Patch F-008 plan with: additive migration only. No destructive schema change is needed for P8.

### A2. `AuditEventName` enum + which actions must emit events?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Closed enum for admin/security/destructive state | Matches F-008 FR-001 and keeps scope small | Does not audit every member chat/evidence request | `domain.delete_queued` |
| Audit every authenticated request | Complete trail | Large volume, chat/retrieval content pressure, query-log drift | `api.request` |
| Free-form event names from routes | Easy to add | Drift and weak tests | arbitrary string |

Recommendation: Option 1.

Patch DATA-001/F-008 spec with this P8 v1 enum:

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
```

Rules:

```text
Public login failures remain safe-log only per PROD-004.
Member chat/evidence requests use safe logs/traces in P8 v1, not audit_events.
If product wants durable member chat/retrieval audit, patch F-008 and DATA-001 before implementation.
```

### A3. Audit metadata shape: typed vs JSON, size limits?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Hybrid typed columns plus bounded allowlisted metadata JSON | Filterable core fields; small room for event-specific safe facts | Requires allowlist tests | `metadata_json: {"count": 2}` |
| All typed columns only | Strongest schema | Too many nullable columns for event-specific counts | `redacted_turn_count` column |
| Generic nested JSON | Flexible | Violates P8 safety and becomes a warehouse | nested payload |

Recommendation: Option 1.

Patch DATA-001 with:

```text
metadata_json:
  nullable Text
  max serialized length 4096 bytes
  flat object only
  keys are allowed per event_name
  values are string <= 200 chars, integer, boolean, or null
```

Allowed P8 v1 metadata keys:

```text
operationType
operationStatus
sourceState
indexState
turnStatus
stopReason
redactedTurnCount
diagnosticKind
lineCount
truncated
limit
elapsedMs
```

Forbidden:

```text
username
email
raw request body
filename/title/display name
prompt
question
answer
source text
evidence excerpt
provider payload
runtime target
storage target
stack trace
credential material
```

### A4. `GET /admin/audit-events` DTO, filters, pagination, errors?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Bounded newest-first list with simple filters | Enough for P8 admin review and OpenAPI | No export/reporting | `limit=50` |
| Full audit search/export | Powerful | Out of P8 scope | CSV export |
| No audit read route | Safer surface | F-008 explicitly names admin read route | none |

Recommendation: Option 1.

Patch API-001 with:

```text
GET /api/v1/admin/audit-events

Query:
  limit?: integer default 50, min 1, max 100
  cursor?: opaque string
  eventName?: AuditEventName
  actorKind?: public | member | administrator | worker | system
  targetKind?: string
  targetId?: string
  requestId?: string
  traceId?: string
  createdFrom?: ISO timestamp
  createdTo?: ISO timestamp

Response:
  {
    "auditEvents": [
      {
        "id": "audit-event-id",
        "eventName": "domain.delete_queued",
        "actorKind": "administrator",
        "actorUserId": "user-id-or-null",
        "targetKind": "domain",
        "targetId": "domain-id",
        "requestId": "request-id-or-null",
        "traceId": "trace-id-or-null",
        "outcome": "succeeded",
        "safeErrorCode": null,
        "metadata": { "operationType": "delete" },
        "createdAt": "2026-07-06T12:00:00Z"
      }
    ],
    "nextCursor": null
  }
```

Errors:

```text
401 unauthenticated
403 forbidden
422 validation_error
```

No member route, export route, delete route, or raw metadata expansion in P8.

### A5. Persist `trace_id` on `conversation_turns`? If yes, how exposed?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Add nullable private `trace_id` on `conversation_turns` | Matches F-008 optional trace id and helps correlate logs/traces | Additive migration; must not leak in P7 DTOs | private `trace_id` |
| Do not persist trace id | Minimal schema | Harder to correlate chat incidents | logs only |
| Expose trace id in API/SSE | Easier support | Public surface not needed in P8 | `turn.traceId` |

Recommendation: Option 1, private only.

Patch DATA-001 with:

```text
conversation_turns.trace_id:
  nullable String(80)
  generated server-side when a Turn is claimed
  safe for logs/traces/audit correlation
  not returned in P7 conversation detail
  not emitted in EVT-001 SSE payloads
```

Patch API-001/EVT-001 with explicit omission rule:

```text
P8 trace_id is private operational metadata.
Conversation DTOs and SSE events do not expose trace_id in P8.
```

Existing rows migrate with `trace_id = null`.

### A6. Diagnostics route response shape, caps, error codes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Contracted bounded safe diagnostics DTO | Useful admin proof without private target leakage | Requires redaction and caps | `lines[]` after redaction |
| Defer diagnostics route from P8 implementation | Safest if boundary/caps cannot be proven | Leaves optional route unimplemented | blocked evidence |
| Raw proxy to runtime diagnostics | Easy | Violates AGENTS/QA-002/PROD-004 | direct runtime output |

Recommendation: Option 1 if API-001/QA-003 are patched; otherwise Option 2. Do not implement Option 3.

Patch API-001 with:

```text
GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag

Query:
  tail?: integer default 100, min 1, max 200

Response:
  {
    "diagnostics": {
      "domainId": "domain-id",
      "kind": "lightrag",
      "capturedAt": "2026-07-06T12:00:00Z",
      "lineCount": 10,
      "truncated": false,
      "lines": [
        { "message": "redacted diagnostic line" }
      ]
    }
  }
```

Caps:

```text
max tail lines: 200
max serialized diagnostics body: 64 KiB
```

Errors:

```text
401 unauthenticated
403 forbidden
404 domain_not_found
409 domain_state_conflict
422 validation_error
502 diagnostics_unavailable
```

Patch QA-003 with: diagnostics lines are post-redaction safe strings only; tests must not store real runtime/provider output.

### A7. OpenAPI snapshot target for new routes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Add `tests/snapshots/f008_openapi.json` | Preserves phase snapshot history and P9 consumes P1-P8 | Need update snapshot test selector | f008 snapshot |
| Mutate `f007_openapi.json` | Simpler test code | Loses P7 boundary evidence | overwrite |
| Skip OpenAPI snapshot for P8 | Fast | Violates AC-002 and P9 contract capture | none |

Recommendation: Option 1.

Patch F-008 test-plan with:

```text
OpenAPI snapshot:
  tests/snapshots/f008_openapi.json

Must include:
  GET /admin/audit-events
  optional GET /admin/domains/{domain_id}/diagnostics/lightrag
  canonical error envelope
  strict query validation
```

Patch tests so the active snapshot comparison uses the P8 snapshot after P8 routes land.

## B. Runtime Integration

### B1. Which boundary fetches LightRAG diagnostics: P3 vs P5 vs new adapter?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| P8 `DiagnosticsService` delegates to existing P3/P5 private boundaries | Keeps API thin and target server-owned | New service wrapper to test | `DiagnosticsService.lightrag_tail(...)` |
| API route calls controller/runtime directly | Fewer layers | Breaks component boundary | route imports runtime details |
| P5 index client owns all diagnostics | Close to LightRAG indexing | Runtime health/log tail is broader than indexing | index service only |

Recommendation: Option 1.

Patch ARCH-002/API-001 with:

```text
Admin diagnostics route -> DiagnosticsService
DiagnosticsService resolves domain through backend authorization
DiagnosticsService delegates to P3 controller/P5 runtime helpers as needed
API route never accepts or constructs browser-supplied private targets
```

No new public runtime contract is created.

### B2. How to test diagnostics redaction without raw fixtures?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Synthetic sentinel fixtures with category labels only | Tests redaction without real private data | Less realistic than live logs | `FORBIDDEN_PROVIDER_TOKEN` |
| Store real runtime snippets in fixtures | Realistic | Violates QA-002/QA-003 | raw runtime line |
| Manual reviewer inspection only | Easy | Weak acceptance evidence | checklist |

Recommendation: Option 1.

Patch QA-003/F-008 test-plan with:

```text
Diagnostics redaction tests use synthetic sentinel strings.
Fixtures must not include real provider payloads, source text, prompts, answers, private paths, runtime addresses, or credential material.
Tests assert sentinels are removed or replaced before response serialization.
```

### B3. Failure behavior when diagnostics unavailable?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safe 502 and audit failed read | Honest admin signal, no private leakage | Adds error code | `diagnostics_unavailable` |
| Return empty diagnostics as success | Simple | Hides operational failure | empty lines |
| Bubble raw runtime error | Debuggable | Forbidden | raw exception |

Recommendation: Option 1.

Patch API-001 with:

```text
Diagnostics boundary unavailable:
  HTTP 502
  code diagnostics_unavailable
  safe message only
  no private runtime/provider details
```

Patch DATA-001 with an audit event:

```text
diagnostics.read
  outcome = failed
  safe_error_code = diagnostics_unavailable
```

### B4. Langfuse isolated to one module?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| One optional tracing wrapper owns external import | Enforces disabled/outage behavior | Needs import scan | `observability/tracing.py` |
| Import in chat/retrieval modules | Quick | Spreads optional dependency and leak risk | direct import |
| No tracing implementation in P8 | Safest | F-008 lists optional wrapper in scope | no adapter |

Recommendation: Option 1.

Patch QA-003/F-008 test-plan with:

```text
Only context_engine/observability/tracing.py may import optional tracing provider packages.
Tracing defaults to no-op.
Tracing outage is safe-logged and ignored.
```

Add source scan test for import isolation.

## C. Workers / Concurrency

### C1. Audit write: same transaction as state change or after commit?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Same transaction for protected admin/security state changes | No successful protected mutation without audit truth | Requires AuditService to share session | domain delete + audit row |
| Best-effort after commit | Product action less likely to fail | Can create unaudited admin changes | post-commit write |
| Async audit queue | Decouples request | New queue/infra out of scope | background audit job |

Recommendation: Option 1 for protected admin/security state changes. Logs/traces remain best-effort.

Patch DATA-001/F-008 spec with:

```text
AuditService.record(...) participates in the same DB transaction for:
  runtime settings changes
  domain lifecycle changes
  source upload/delete/retry/cancel
  index retry/cancel
  redaction transitions

The product mutation and audit row commit together.
```

For read-only audit/diagnostics reads, write the audit row before returning the read response.

### C2. What if audit write fails on protected admin action?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Roll back protected action and return safe failure | Preserves audit truth | New failure mode for admin actions | `audit_unavailable` |
| Let action succeed and log audit failure | Preserves old behavior | Breaks audit accountability | missing row |
| Retry in background | Better eventual audit | New worker/queue out of scope | retry job |

Recommendation: Option 1.

Patch API-001 with:

```text
audit_unavailable:
  HTTP 503
  message: "Action could not be recorded."
```

Patch F-008 test-plan with:

```text
Simulated audit persistence failure rolls back protected admin mutation.
Product responses never include raw database/audit exception text.
```

This does not change P1-P7 success behavior when audit is healthy.

### C3. Log context across workers/SSE?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Explicit LogContext passed or set at boundaries | Testable and avoids hidden coupling | Slight plumbing | request -> service -> stream |
| Global mutable context only | Convenient | Leaks between tests/requests | module global |
| Route-only logs | Simple | Worker/SSE evidence missing | no worker context |

Recommendation: Option 1.

Patch QA-003 with:

```text
LogContext:
  request_id
  trace_id
  actor_kind
  http_method
  http_route
  domain_id
  source_id
  conversation_turn_id
  operation_id

Workers create context from operation rows.
SSE streaming captures context at claim/start and uses safe terminal records only.
```

### C4. Prevent duplicate logs/traces on P7 turn replay?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Mark replay logs/traces and assert no provider/retrieval spans | Preserves idempotency evidence | Needs counters/fakes | `replay=true` |
| Suppress all replay logs | Quiet | Hides useful idempotency evidence | none |
| Log replay as full turn | Misleading | Looks like second provider call | duplicate completion |

Recommendation: Option 1.

Patch F-008 test-plan with:

```text
P7 replay observability regression:
  duplicate completed turn emits replay diagnostic only
  no provider span/log
  no retrieval span/log
  no new audit event for chat content
```

## D. Delete / Redaction

### D1. Which delete/redaction transitions get audit events?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Audit destructive admin transitions and redaction summary | Covers accountability without chat content | Does not audit every turn | `chat.turn_redacted` |
| Audit every affected turn with full detail | Traceable | Content/privacy risk and high volume | per-turn content |
| No redaction audit | Simpler | Destructive state transition lacks accountability | no event |

Recommendation: Option 1.

Patch DATA-001 with required events:

```text
domain.delete_queued
domain.delete_succeeded
domain.delete_failed
source.deleted
chat.turn_redacted
```

Rules:

```text
chat.turn_redacted metadata may include redactedTurnCount.
Do not store userMessage, assistantAnswer, evidence excerpt, source text, or citation text.
Do not expose private Source Block ids.
```

### D2. Any audit export/delete routes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Admin read only | Matches P8 scope and immutability | No export/reporting | `GET /admin/audit-events` |
| Add export route | Useful operations | Out of scope and retention-heavy | export file |
| Add delete/retention route | Operational cleanup | F-008 excludes retention worker | delete audit |

Recommendation: Option 1.

Patch API-001 with:

```text
P8 audit routes:
  GET /admin/audit-events only

No audit create, update, delete, export, or retention routes in P8.
```

### D3. Destructive schema change policy?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| P8 uses additive schema only | Easy rollback and matches DEL-002 | Leaves unused columns if code rolls back | add table/nullable column |
| Destructive cleanup now | Clean schema | Requires compensation plan | drop fields |
| No schema | Avoids migrations | Cannot implement audit truth | logs only |

Recommendation: Option 1.

Patch F-008 plan with:

```text
P8 migrations are additive:
  create audit_events
  optionally add nullable conversation_turns.trace_id

Rollback:
  code rollback may leave additive schema in place.
  no destructive schema change is allowed without DEL-002 compensation.
```

## E. Storage / Privacy

### E1. Which actor/target IDs are safe in audit rows?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safe internal ids only; no labels/content | Supports admin accountability | Admin UI may need lookup via normal APIs | `domain`, `source`, `operation` ids |
| Store display labels/usernames | Easier reading | Names/titles can leak private content | filename/title |
| Store private source/block/evidence ids freely | Debuggable | Violates evidence/source privacy | Source Block id |

Recommendation: Option 1.

Patch DATA-001 with:

```text
Allowed actor_user_id:
  users.id only; nullable

Allowed target ids:
  domain id
  source_document id
  domain_operation id
  source_preparation_operation id
  conversation_turn id only for redaction metadata when needed

Forbidden target ids:
  source_block_id
  conversation_turn_evidence_refs.id
  provider request id
  runtime/container/private controller id
```

Audit DTOs must not include usernames, emails, filenames, titles, display names, source text, user questions, assistant answers, or evidence excerpts.

### E2. User-agent/IP HMAC key + retention?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Defer IP/user-agent fingerprints in P8 v1 | Avoids key/retention scope and matches QA-003 "do not log raw" | Less forensic detail | no fingerprint |
| Add HMAC fingerprints now | Better abuse correlation | Requires key source, retention, tests | fingerprint fields |
| Store raw IP/user-agent | Simple | Explicitly forbidden by QA-003 | raw headers |

Recommendation: Option 1.

Patch DATA-001/QA-003 with:

```text
P8 v1 does not persist or log raw IP, raw user agent, or derived IP/user-agent fingerprints.
```

Open decision if the team wants fingerprints later:

```text
Owner: DATA-001 + QA-003
Needed: HMAC key source, rotation, retention, and DTO omission rules.
```

Do not block P8 implementation on fingerprints.

### E3. Allowed metadata keys in logs/traces?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Closed allowlist by layer | Testable and safe | Needs updates for new fields | `elapsed_ms` |
| Free-form metadata | Flexible | Leaks easily | arbitrary dict |
| No metadata | Safest | Weak diagnostics | outcome only |

Recommendation: Option 1.

Patch QA-003 with:

```text
Log metadata:
  timestamp
  level
  logger
  event
  request_id
  trace_id
  actor_kind
  domain_id
  source_id
  conversation_turn_id
  operation_id
  safe_error_code
  elapsed_ms
  http_method
  http_route
  http_status
  outcome
  replay

Trace metadata:
  trace_id
  request_id
  conversation_turn_id
  domain_id
  route
  stop_reason
  plan_step_count
  retrieval_operation_count
  repair_attempt_count
  mapped_evidence_count
  discarded_hit_count
  citation_count
  elapsed_ms
  provider_kind
  synthesis_profile_id
```

No content fields.

### E4. How tests prove no source/question/answer/prompt/path/URL leaks?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safety snapshot/fixture scan across P8 outputs | Strong and automatable | Needs maintained pattern list | scan JSON/logs |
| Manual review only | Flexible | Weak evidence | checklist |
| Trust DTO models | Useful but insufficient | Logs/traces can still leak | schemas only |

Recommendation: Option 1.

Patch F-008 test-plan with:

```text
Safety scan scope:
  audit API responses
  log snapshot fixtures
  tracing test payloads
  diagnostics responses
  OpenAPI examples
  acceptance evidence artifacts

Forbidden categories:
  secret or credential material
  raw request body
  prompt text
  user question text
  assistant answer text
  source text
  evidence excerpt in audit/log/trace
  raw provider payload
  raw LightRAG payload
  runtime target
  storage target
  stack trace
  private source/block ids in public surfaces
```

## F. Authz

### F1. Member/Public on audit route?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Administrator-only | Matches F-008/PROD-004 and keeps audit confidential | Members cannot self-serve audit | `require_admin` |
| Member sees own audit rows | Appealing | Needs new privacy contract | member audit |
| Public denied but member read | Not supported | Leaks admin/security metadata | member route |

Recommendation: Option 1.

Patch API-001:

```text
GET /admin/audit-events:
  Public/no session -> 401 unauthenticated
  Member -> 403 forbidden
  Administrator -> 200 bounded safe DTO
```

### F2. Optional diagnostics route admin-only, redacted, bounded, audited?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Administrator-only with audit event | Matches PROD-004 and F-008 | Requires AuditService before diagnostics | `diagnostics.read` |
| Member-accessible diagnostics | Useful support | Violates role boundary | member diagnostics |
| Unauthenticated health-like diagnostics | Simple ops | Leaks runtime state | public route |

Recommendation: Option 1.

Patch API-001/PROD-004 with:

```text
GET /admin/domains/{domain_id}/diagnostics/lightrag:
  Administrator-only
  bounded
  redacted
  audited as diagnostics.read
```

### F3. Auth failures: audit row or safe log only?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Public auth failures safe-log only; authenticated admin-route denial audited | Matches PROD-004 and captures security-relevant admin access attempts | Two paths to test | `security.admin_route_denied` |
| Audit every login failure | More forensic | Public auth failure volume and privacy risk | login audit |
| Log only all authz failures | Simpler | Misses authenticated attempts to admin surfaces | no audit |

Recommendation: Option 1.

Patch DATA-001/QA-003 with:

```text
Public unauthenticated login/auth failures:
  safe JSON log only
  no audit_events row

Authenticated Member denied on admin audit/diagnostics/admin mutation route:
  safe JSON log
  audit_events security.admin_route_denied
  no route body or private target details
```

### F4. Admins must not see chat content via audit?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Audit only metadata/counts for chat/redaction | Preserves privacy and accountability | Admin cannot reconstruct content | redacted count |
| Audit full chat turn content | Useful investigation | Violates F-008/QA-002 | user message |
| No chat-related audit at all | Safest | Redaction lacks accountability | none |

Recommendation: Option 1.

Patch DATA-001/API-001 with:

```text
Audit DTOs never include:
  conversation_turns.user_message
  conversation_turns.assistant_answer
  evidence excerpts
  citation labels
  source labels

chat.turn_redacted may include:
  targetKind = conversation_turn
  targetId = turn id
  metadata.redactedTurnCount when recorded as a batch event
```

## G. Test / Evidence

### G1. Exact ruff/lint/type commands?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Patch tooling into test extras and run explicit commands | Makes DEL-002 gate real | Adds tooling dependency | `python -m ruff check ...` |
| Record missing type/lint tools as blocked evidence | Honest | Still blocks P8 acceptance | blocked row |
| Treat pytest as lint/type | Easy | Not true | tests only |

Recommendation: Option 1 for lint; type checker remains an open tooling decision.

Patch F-008 test-plan with:

```text
Compile:
  python -m compileall context_engine tests

Lint:
  python -m ruff check context_engine tests
```

Patch `pyproject.toml` test extras or developer tooling before claiming AC-001, because `ruff` was missing during P7. Static type checking is not configured today. Open decision:

```text
Owner: F-008 test-plan / project tooling
Decide before P8 acceptance:
  add mypy/pyright and command
  OR revise AC-001 to "compile/lint" for this repo with a documented no-typechecker limitation
```

Do not block T-010 on the type checker decision, but do not mark AC-001 complete without resolving it.

### G2. Secret scan command/scope?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Add repo-local safe scan script | Deterministic, no external dependency | Needs implementation | `python scripts/secret_scan.py` |
| Use ad hoc PowerShell scan | Fast locally | Harder for CI/reuse | `Select-String` |
| Add external secret scanner now | Stronger | More dependency/tooling work | third-party scanner |

Recommendation: Option 1.

Patch F-008 test-plan with:

```text
Secret/safety scan:
  python scripts/secret_scan.py

Scope:
  context_engine/
  tests/
  migrations/
  specs/
  .devnotes/P7-post-impl-REVIEW/
  scripts/
  .github/

Exclusions:
  .references/
  tests/.pytest-tmp/
  __pycache__/
  vendor/
```

Scan categories must include credential material, prompt/question/answer/source text examples in audit/log/trace fixtures, runtime targets, storage targets, raw provider payloads, raw LightRAG payloads, and stack traces.

### G3. Compose smoke command + fixtures?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Add explicit compose fixture before claiming AC-004 | Makes RUN-001 real | Root compose file is not present today | compose smoke |
| Mark compose smoke blocked until fixture exists | Honest and safe | P8 cannot claim pilot-ready | blocked evidence |
| Skip compose because unit tests pass | Fast | Violates RUN-001/AC-004 | no smoke |

Recommendation: Option 1 for shipping; Option 2 until the fixture exists.

Patch RUN-001/F-008 test-plan with:

```text
Compose smoke owner:
  delivery/runbook fixture

Required proof:
  API health
  database connectivity
  worker/runtime boundary available or explicitly faked for local
  private runtime health check when target Docker fixture is available
  no browser-visible private runtime target
```

Open decision:

```text
No root compose file is present in this checkout.
Before AC-004 can pass, add or name the pilot compose fixture and command.
```

### G4. Pilot flow script/evidence format?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Add scripted runbook helper with redacted evidence output | Repeatable and acceptance-friendly | Needs maintenance | `scripts/pilot_flow.py` |
| Manual checklist only | Flexible | Weak regression evidence | runbook note |
| Fold into unit tests only | Easy | Does not prove deployed flow | pytest only |

Recommendation: Option 1.

Patch RUN-001/F-008 test-plan with:

```text
Pilot flow evidence:
  command
  date/time
  environment
  commit/status reference
  pass/fail for each step
  safe request ids/operation ids only
  no source text, prompts, answers, provider payloads, runtime targets, storage targets, or credentials

Flow:
  auth
  domain create/start
  source upload
  source prepare
  source index
  evidence retrieve
  conversation turn stream
  source/domain delete
  chat redaction verification
```

### G5. Load test tool + pass threshold for 5-10 users?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Pytest expected-load test with deterministic fakes plus pilot run note | Fits repo, avoids new load stack | Not a full benchmark tool | 10 concurrent turns |
| Add dedicated load-test framework | Stronger | Extra dependency and scope | load suite |
| Manual multi-user smoke only | Simple | Weak evidence | human check |

Recommendation: Option 1.

Patch F-008 test-plan/QA-004 with:

```text
Expected-load test:
  10 concurrent authenticated users
  mix of conversation create, direct turn, domain evidence/chat where fixtures allow
  no request returns unsafe 5xx
  no P7 idempotency/replay regression
  all completed within approved turn timeout budget or documented target limit
  logs contain safe metadata only
```

If real provider/runtime quotas are required, record a pilot-like manual runbook evidence item in addition to deterministic tests.

### G6. Failure injection fixtures?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Test fakes for each required failure mode | Deterministic and safe | Some compose-only failures still need runbook proof | fake provider timeout |
| Real dependency outages only | Realistic | Slow/flaky and can expose raw errors | kill DB |
| Defer failure injection | Fast | Violates AC-008 | none |

Recommendation: Option 1 plus runbook proof for any compose-only case.

Patch F-008 test-plan with:

```text
Failure fixtures:
  provider timeout -> safe provider/turn error, no raw payload
  worker unavailable -> safe health/readiness or operation failure evidence
  DB unavailable -> readiness fails safely, no partial success claim
  invalid upload -> source_file_unsupported or source_file_too_large
  diagnostics unavailable -> diagnostics_unavailable
  tracing outage -> ignored; core behavior continues
```

## Contract Patch Order For Junior Dev

1. Patch `DATA-001` with `audit_events`, `AuditEventName`, audit metadata rules, immutability, same-transaction audit rule, audit failure behavior, and private `conversation_turns.trace_id`.
2. Patch `API-001` with `GET /admin/audit-events`, optional diagnostics DTO/caps/errors, admin-only authz rules, `audit_unavailable`, and OpenAPI snapshot target.
3. Patch `QA-003` with safe log event naming, log/trace allowlists, exception policy, tracing isolation, diagnostics redaction/caps, and no IP/user-agent fingerprint rule.
4. Patch F-008 `spec.md`, `plan.md`, and `test-plan.md` with these decisions, including diagnostics optionality, same-transaction audit, launch gate commands, and test fixtures.
5. Patch `RUN-001` with the evidence format and named compose/pilot-flow commands once the fixture/scripts exist.
6. Implement T-010: audit migration/model, optional trace id migration, migration tests.
7. Implement T-020: `AuditService`, enum validation, same-transaction instrumentation for approved admin/security/destructive transitions.
8. Implement T-030: safe log context helper and snapshots.
9. Implement T-040: no-op tracing wrapper, optional Langfuse adapter behind one module, disabled/outage/import-isolation tests.
10. Implement T-050: admin audit route; diagnostics route only if contract and boundary are closed.
11. Implement T-060: pilot flow helper, expected-load test, failure injection tests, compose smoke fixture or blocked evidence.
12. Run T-900 checks, including P7 SSE regression.
13. Update F-008 acceptance, implementation log, feature register, traceability, and known limitations.

## Red Flags In PR

| Red flag | Why it is bad | Junior-dev rule |
| --- | --- | --- |
| P8 code changes P7 SSE event names/payloads | Violates "wrap existing behavior" gate | P7 SSE regression must stay green. |
| `audit_events.metadata_json` accepts arbitrary nested payloads | Becomes unsafe event warehouse | Use per-event allowlisted flat safe metadata. |
| Logs or traces include request body, prompt, question, answer, source text, evidence excerpt, provider payload, runtime target, storage target, or stack trace | Violates QA-002/QA-003 | Log/trace metadata only. |
| Langfuse import appears outside the tracing wrapper | Optional dependency leaks into product path | One module owns tracing adapter. |
| Tracing outage changes product behavior | Violates QA-004 | Outage is ignored and safe-logged. |
| Diagnostics accepts `path`, `url`, `container`, `provider`, or `runtime` request fields | Browser drives private runtime | Route accepts only approved params; server resolves target. |
| Diagnostics response is not audited | Admin diagnostic reads are security-relevant | Always record `diagnostics.read`. |
| Public auth failures write audit rows with raw request data | Contradicts PROD-004 and privacy rules | Public auth failures are safe-log only. |
| Audit route exposes usernames, filenames, titles, chat messages, answers, excerpts, or private source/block ids | Admin audit becomes content leak | Audit DTOs use safe ids and counts only. |
| Audit write failure still commits protected admin mutation | Breaks audit truth | Roll back and return safe failure. |
| Compose/load/failure gates are skipped but acceptance says implemented | False pilot readiness | Acceptance must cite real evidence or blocked owner. |
| Root docs imply production scale readiness | QA-004 only approves 5-10 user pilot target | State the pilot target and limitations. |

## Context And ADR Notes

`CONTEXT.md` does not need vocabulary changes. It already defines Knowledge Domain, Source Document, Evidence, Citation, Conversation, Turn, Redaction, Administrator, and Member. P8 adds observability mechanics around those terms, not new product entities.

No ADR is needed for the base P8 shape. The constitution, F-008, DATA-001, API-001, QA-003, DEL-002, and RUN-001 already govern the decisions.

Create an ADR only if the team chooses one of these later:

- audit export/delete/retention behavior;
- HMAC IP/user-agent fingerprinting;
- metrics stack or external collector;
- diagnostics boundary that requires a new private controller protocol;
- content tracing;
- broader member chat/retrieval audit persistence.

Deferred hooks:

- P9 visual checks remain a launch dependency in RUN-001, not P8 backend implementation.
- Audit retention worker is explicitly out of P8.
- Full content tracing is explicitly out of P8.
- Source navigation and source-ref contracts stay outside P8.

## QA

- Readiness question IDs covered: A1, A2, A3, A4, A5, A6, A7, B1, B2, B3, B4, C1, C2, C3, C4, D1, D2, D3, E1, E2, E3, E4, F1, F2, F3, F4, G1, G2, G3, G4, G5, G6.
- Open decisions still blocking coding:
  - G1: choose static type-checker policy before marking AC-001 complete.
  - G3: name or add the compose smoke fixture/command before AC-004 can pass.
  - E2: if the team wants IP/user-agent fingerprints in P8, patch DATA-001/QA-003 first; default recommendation is defer.
- Forbidden-string scan result: this document names forbidden categories as exclusion rules only. It includes no credential literals, concrete runtime addresses, concrete host filesystem locations, tracebacks, raw provider payloads, raw runtime payloads, or raw source content examples.
- Output path written: `.devnotes/P7-post-impl-REVIEW/F-008-P8-reconciled-design-gates.md`.
- Style parity confirmed: Scope, Sources Grilled, Product DNA Locks, Recommended Build Shape, A-G gates, Contract Patch Order, Red Flags, Context/ADR Notes, and QA.
