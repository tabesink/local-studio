# Context Engine — P8: Lean Observability + Security Audit

**Status:** Greenfield vertical-slice implementation plan  
**Build style:** Native audit first. Structured stdout second. Optional metadata-only Langfuse third.  
**Depends on:** P0 shared contract; P1 auth/session; P2 trusted configuration; P3 domains; P4 sources; P5 indexing; P6 evidence; P7 modular query routing + streaming chat.  
**Amends:** P0 §16 only by concretizing structured log implementation and adding optional `trace_id`. P7 §22 Langfuse rule becomes implementation detail here.  
**Style:** Caveman. Terse. Tech exact.

---

# 0. Goal

Give Context Engine enough operational visibility for a 5–10 user trusted deployment without turning Context Engine into an observability platform.

```text
Postgres audit events
  -> security/accountability system of record.

Structured stdout logs
  -> runtime/operator diagnostics.

Langfuse
  -> optional RAG/LLM tracing and debugging.
  -> metadata-only by default.
  -> never security/audit system of record.
```

Target visibility:

```text
auth success/failure/denial
admin lifecycle and source actions
request correlation
chat-turn correlation
document/job/operation correlation for indexing work
query routing outcome
LightRAG external track correlation
LightRAG request latency
LightRAG provider status mapped to Context Engine state
exact-map evidence health counts
synthesis latency/tokens/cost when provider returns usage
safe provider diagnostic availability for admins
safe failure category
```

Do not capture by default:

```text
passwords
session cookies
authentication tokens
provider secrets
raw prompts
raw questions
raw answers
raw source blocks
raw LightRAG hits
source/image bytes
storage paths
remote runtime IDs
external provider URLs
raw exception text
```

---

# 1. Final Decisions

```text
1. Native Postgres audit is mandatory.

2. JSON stdout logs are mandatory.

3. Langfuse is optional and failure-isolated.

4. Langfuse is not added to Context Engine docker-compose.

5. Managed Langfuse or separately operated Langfuse is allowed.
   Self-hosted Langfuse is NOT part of the core Context Engine runtime.

6. One neutral UUID trace_id correlates a chat turn, stdout events, audit events,
   and an optional Langfuse trace.

7. No new native query_logs table.
   Conversation turns already own durable chat state.
   P6 evidence is request-scoped.
   Langfuse owns optional RAG/LLM trace detail.

8. No direct Langfuse imports outside app/observability/tracing.py.

9. No automatic provider SDK wrapping.
   Context Engine emits explicit manual metadata spans only.

10. No prompt management, evals, LLM-as-judge, datasets, feedback system,
    Langfuse dashboard proxy, or custom observability dashboard.

11. Context Engine product state is authoritative.
    LightRAG status is provider status only.
    Provider logs are diagnostics only.

12. LightRAG document observability uses the P5 adapter seam.
    No route, frontend component, audit service, or tracing code talks to raw
    LightRAG endpoints or status strings directly.

13. Context Engine parses source content once, creates the canonical source
    model, then submits deterministic text to LightRAG. P8 observes that flow;
    it does not restore raw-file upload to LightRAG.
```

---

# 2. Scope

## Build

```text
one immutable native audit_events table
one native AuditEventName enum
one safe AuditService + SQL-only repository
one admin audit-events read route
one standard-library JSON stdout formatter
one request/log context helper
one neutral trace_id on new conversation turns
one safe LightRAG provider-status/logging taxonomy for existing P5 jobs
one bounded admin-only provider diagnostics read path
one optional Langfuse wrapper module
one no-op trace implementation when Langfuse disabled
manual metadata-only spans for P6/P7 request flow
manual metadata-only spans for P5 LightRAG submit/readiness/delete
safe audit wiring for P1–P5 security/admin actions
configuration validation
unit, Postgres integration, response-shape, log-shape, and failure-isolation tests
operator runbook
```

## Do not build

```text
query_logs table
raw query persistence
raw prompt persistence
raw answer persistence outside approved conversation turn answer
full-text audit search
custom dashboard
metrics backend
Prometheus
Grafana
OpenTelemetry collector
SIEM integration
alerting/notifications
background audit cleanup worker
retention scheduler
audit event bus
outbox
Kafka
Redis
Celery/RQ
Langfuse in core compose
Langfuse reverse proxy
Langfuse browser SDK
Langfuse admin API proxy
Langfuse prompt management
evals or LLM-as-judge
source/image tracing
per-user Langfuse tracking
provider request-body capture
provider log persistence
browser/provider diagnostics passthrough
```

---

# 3. Core Policy

## 3.1 Three layers, three jobs

| Layer | Owner | Purpose | Must still work when Langfuse is down? |
| --- | --- | --- | --- |
| `audit_events` | Context Engine Postgres | Security and admin accountability | Yes |
| JSON stdout | Context Engine process | Runtime/operator diagnostics | Yes |
| Langfuse | Optional external observability deployment | RAG/LLM trace and performance debugging | Core app continues without it |

```text
Audit answers:
  Who did a security/admin action?
  What safe action happened?
  What target was affected?
  When?

Stdout answers:
  What request/process event occurred?
  What safe outcome and latency occurred?
  Which request/turn/trace correlates it?

Langfuse answers:
  Where did a RAG/LLM turn spend time?
  Did retrieval, evidence mapping, synthesis, and settlement finish safely?
  How many raw hits mapped to evidence?
  Did synthesis fail, retry, or finish?
  What safe token/cost metadata was returned?
```

No layer replaces another.

P5 source/job/operation state is product state, not a fourth observability backend.
P8 may require narrow safe fields on those existing rows, but it does not create a
provider-event warehouse or infer product state from logs.

## 3.2 Privacy default

```text
Postgres audit:
  safe IDs, event names, safe category metadata only.

Stdout:
  safe operational fields only.

Langfuse:
  metadata only by default.
  no raw question, answer, prompt, evidence, source, or asset content.
```

`LANGFUSE_CAPTURE_QUERY_TEXT=false` is the default.

When false:

```text
Langfuse input/output fields remain absent.
```

When true:

```text
Only the user question may be sent.
Never prompt, answer, evidence, source text, title, asset, or provider response.
Question passes conservative redaction + length cap first.
```

No capture mode ever sends complete document-derived content to Langfuse.

## 3.3 Failure isolation

```text
Langfuse disabled
  -> no network calls.

Langfuse startup configuration invalid while enabled
  -> API startup fails safely.

Langfuse network/export failure after startup
  -> safe structured log.
  -> no retry loop owned by Context Engine.
  -> chat/retrieval/upload/auth continue.

Native audit write fails during successful admin mutation
  -> action transaction fails.
  -> no un-audited successful admin mutation.

Native audit write fails while recording denied access
  -> still deny access.
  -> write safe stdout error only.
```

---

# 4. Greenfield Reconciliation

## 4.1 P0 remains authoritative

P0 §16 remains the canonical structured log rule:

```text
event
request_id
actor_kind
domain_id
source_id
conversation_turn_id
operation_id
safe_error_code
elapsed_ms
```

P8 adds optional safe fields only:

```text
trace_id
http_method
http_route
http_status
audit_event_id
outcome
```

Do not create a second logging schema.

## 4.2 P1 auth model wins

Greenfield P1 uses opaque HttpOnly session cookies and DB-backed session rows.

P8 does **not** restore legacy bearer JWT assumptions.

Use event names:

```text
auth.login_succeeded
auth.login_failed
auth.session_rejected
auth.user_inactive
auth.admin_access_denied
```

Rules:

```text
missing cookie
  -> normal unauthenticated result.
  -> no audit event; avoids noise.

present but invalid/expired/revoked cookie
  -> auth.session_rejected audit event.

disabled user login attempt
  -> auth.user_inactive audit event.

member directly calls admin route
  -> auth.admin_access_denied audit event.
  -> response stays 403 forbidden.
```

## 4.3 No legacy query logs

The current legacy branch has `query_logs` and optional raw query storage.

Greenfield does not copy that table.

Reason:

```text
P6 evidence requests are short-lived and request-scoped.
P7 conversation_turns already persist user questions and approved answers.
P0/P6 prohibit raw query/audit persistence.
Langfuse owns optional trace detail.
```

Use `conversation_turns.trace_id` for durable chat-turn correlation, not a second query-log record.

## 4.4 Existing P7 Langfuse policy becomes concrete

P7 allows optional masked metadata traces. P8 defines:

```text
one wrapper module
one trace taxonomy
one metadata allowlist
one config policy
one failure policy
one test gate
```

## 4.5 LightRAG observability devnote reconciliation

Adopt these LightRAG-informed constraints:

```text
LightRAG track_id
  -> stored as safe external provider reference on the P5 job/source-index attempt.

LightRAG document status
  -> polled through the backend adapter.
  -> mapped to Context Engine source/job state.
  -> never exposed as the member-facing status vocabulary.

LightRAG pipeline status/latest message
  -> admin diagnostics only.
  -> capped, redacted, not product state.

LightRAG logs
  -> privileged diagnostic supplement only.
  -> not parsed to drive source state.
  -> not persisted in Postgres by default.

LightRAG query references
  -> normalized by P6 into EvidenceItem before P7 streams answer tokens.
  -> raw references/content never pass through as the browser contract.
```

Reject these devnote-era shapes for greenfield P8:

```text
query_logs table
legacy audit_logs naming
raw provider status in frontend DTOs
FastAPI background task ownership for durable indexing work
LightRAG raw-file parsing as canonical source parsing
provider logs as audit trail
```

Use P8 names and owners instead:

```text
audit_events, not audit_logs.
conversation_turns.trace_id, not query_logs.trace_id.
P5 source/index job state, not generic events table.
P6 evidence counters, stdout, and optional Langfuse metadata for query observability.
```

---

# 5. Runtime Shape

```text
+---------+
| Browser |
+---------+
     |
     | authenticated request
     v
+--------------------------------------------------------+
| Context Engine API                                     |
|                                                        |
| P1 auth/session                                        |
| P2 config                                              |
| P3/P4/P5 admin operations                              |
| P6 evidence                                            |
| P7 turn executor + SSE                                 |
|                                                        |
| 1. AuditService -> Postgres audit_events               |
| 2. JSON logger -> stdout                               |
| 3. tracing.py -> optional Langfuse export              |
+--------------------------------------------------------+
      |                  |                       |
      |                  |                       | optional outbound HTTPS
      v                  v                       v
+-------------+   +------------------+     +----------------------+
| PostgreSQL  |   | Private LightRAG |     | Managed or Separate  |
| app DB      |   | per-domain       |     | Langfuse deployment  |
| - audit     |   | runtime          |     | - trace UI/storage   |
| - turns     |   +------------------+     +----------------------+
| - sources   |
| - jobs/ops  |
+-------------+
```

Rules:

```text
Browser never reaches Langfuse through Context Engine.
Browser never receives Langfuse key, trace ID, dashboard URL, prompt, or raw span.
Context Engine API never depends on Langfuse availability for a user result.
Context Engine compose never gets Redis/ClickHouse/blob storage for Langfuse.
```

---

# 6. Canonical Ownership

| Concern | Owner | Never duplicate into |
| --- | --- | --- |
| Audit event taxonomy | `audit/events.py` | Routes, arbitrary strings, browser |
| Audit persistence | `AuditRepository` | Langfuse, stdout, domain tables |
| Audit record policy | `AuditService` | Generic event bus |
| JSON stdout format | `core/logging.py` | Each service |
| Request correlation | P1 request-ID middleware + `core/log_context.py` | Browser state |
| Chat trace ID | P7 `conversation_turns.trace_id` | Query-log table |
| Source/job state | P5 source/index job services | Provider logs, Langfuse, audit rows |
| LightRAG adapter/status mapping | P5 integration adapter | Routes, frontend, audit service, tracing wrapper |
| Safe provider diagnostics | P5/admin diagnostics endpoint | Product state, audit metadata, member APIs |
| Langfuse setup/export | `observability/tracing.py` | Routes, repositories, provider adapters |
| Source eligibility | P5 `source_is_query_eligible()` | Tracing or chat code |
| Evidence mapping | P6 `map_hit()` | Tracing or chat code |
| Turn settlement | P7 `ChatTurnService` | Query flow/tracing code |

No duplicate owner.

---

# 7. Database — Migration 0008_observability_and_audit

## 7.1 `audit_events`

Create one immutable table.

```text
audit_events
  id UUID PK
  event TEXT NOT NULL
  actor_user_id UUID NULL FK -> users.id ON DELETE SET NULL
  target_kind TEXT NULL
  target_id TEXT NULL
  request_id UUID NULL
  trace_id UUID NULL
  client_fingerprint TEXT NULL
  user_agent_fingerprint TEXT NULL
  safe_metadata JSONB NOT NULL DEFAULT '{}'
  created_at TIMESTAMPTZ NOT NULL
```

Rules:

```text
`event`
  -> must come from AuditEventName enum.
  -> never caller-supplied arbitrary text.

actor_user_id
  -> known user when authentication succeeded.
  -> null for unknown login failure.

target_kind + target_id
  -> safe administrative correlation only.
  -> no filesystem path, provider key, runtime ID, or raw source content.

request_id
  -> P1 request UUID when available.

trace_id
  -> nullable.
  -> used for chat/evidence correlation only.

client_fingerprint
  -> truncated HMAC of trusted connection peer address.
  -> never raw IP.

user_agent_fingerprint
  -> truncated HMAC of user-agent header.
  -> never raw user-agent.

safe_metadata
  -> strict per-event allowlist.
  -> no unbounded blobs.
  -> no raw exception message.
```

No:

```text
update route
delete route
soft delete
archive flag
payload JSON
before/after object snapshots
raw body
IP address column
user-agent column
password/token/credential field
```

Indexes:

```sql
CREATE INDEX ix_audit_events_created_at
ON audit_events (created_at DESC);

CREATE INDEX ix_audit_events_actor_created_at
ON audit_events (actor_user_id, created_at DESC)
WHERE actor_user_id IS NOT NULL;

CREATE INDEX ix_audit_events_event_created_at
ON audit_events (event, created_at DESC);

CREATE INDEX ix_audit_events_request_id
ON audit_events (request_id)
WHERE request_id IS NOT NULL;

CREATE INDEX ix_audit_events_trace_id
ON audit_events (trace_id)
WHERE trace_id IS NOT NULL;
```

No GIN index on `safe_metadata` initially. Add only after a real query-plan need.

## 7.2 `conversation_turns.trace_id`

Add one nullable neutral UUID column:

```text
conversation_turns.trace_id UUID NULL
```

Rules:

```text
new turn
  -> application creates UUID before insert.
  -> trace_id persists even when Langfuse disabled.

existing historical turn
  -> trace_id remains null.
  -> no data migration/backfill required.

trace_id
  -> internal only.
  -> never returned in member turn DTO.
  -> never browser supplied.
```

Index:

```sql
CREATE INDEX ix_conversation_turns_trace_id
ON conversation_turns (trace_id)
WHERE trace_id IS NOT NULL;
```

Do not add:

```text
langfuse_trace_id column
query_logs table
trace payload column
trace status column
trace retry column
trace export queue
```

`trace_id` is vendor-neutral. `tracing.py` may use it as the optional Langfuse trace identity.

## 7.3 Existing P5 source/index job observability fields

P8 does not create a generic event table or query-log table. It does require P5
source/index execution to expose a small safe status surface. Add these fields
only where P5 has not already provided an equivalent.

```text
source/index job
  request_id UUID NULL
  operation_id UUID NULL
  actor_user_id UUID NULL
  domain_id UUID NOT NULL
  source_id UUID NULL
  state TEXT NOT NULL                 # queued | running | waiting_provider | succeeded | failed | cancelled
  stage TEXT NULL                     # parsing | normalizing | chunking | indexing | verifying | deleting
  attempt INTEGER NOT NULL DEFAULT 1
  external_provider TEXT NULL         # lightrag
  external_track_id TEXT NULL         # safe provider reference, admin-only
  external_status TEXT NULL           # raw provider enum/string, admin-only
  provider_last_seen_at TIMESTAMPTZ NULL
  next_poll_at TIMESTAMPTZ NULL
  safe_error_code TEXT NULL
  safe_error_summary TEXT NULL
  safe_diagnostics JSONB NOT NULL DEFAULT '{}'
  started_at TIMESTAMPTZ NULL
  finished_at TIMESTAMPTZ NULL
```

Rules:

```text
external_track_id
  -> stored only after LightRAG accepts a deterministic submission.
  -> never returned in member APIs.

external_status
  -> raw LightRAG status for admin/operator diagnosis.
  -> never drives frontend status labels directly.

safe_diagnostics
  -> capped JSON object.
  -> max 10 keys.
  -> max 300 chars per string.
  -> no raw provider message unless passed through redaction + cap.
  -> no source text, prompt, answer, headers, stack trace, URL, path, or secret.

state/stage
  -> Context Engine vocabulary.
  -> updated by P5 services/workers only.
  -> not inferred from provider logs.
```

Allowed provider status mapping:

| LightRAG signal | Context Engine state/stage |
| --- | --- |
| submission accepted / track ID returned | `waiting_provider` / `indexing` |
| `PENDING` | `waiting_provider` / `indexing` |
| `PARSING`, `ANALYZING`, `PROCESSING` | `waiting_provider` / `indexing` |
| all provider docs `PROCESSED` | `running` / `verifying` |
| verification succeeds | `succeeded` / null |
| provider `FAILED` | `failed` with mapped `safe_error_code` |
| provider track absent beyond reconciliation window | `failed` as `provider_track_lost` after retry policy exhausted |
| provider cancellation after Context Engine cancellation | `cancelled` / null |

Do not expose LightRAG's internal status vocabulary as the public source status
contract. Member source status remains the P4/P5 Context Engine status contract.

---

# 8. Audit Event Taxonomy

One source of truth:

```python
class AuditEventName(StrEnum):
    AUTH_LOGIN_SUCCEEDED = "auth.login_succeeded"
    AUTH_LOGIN_FAILED = "auth.login_failed"
    AUTH_SESSION_REJECTED = "auth.session_rejected"
    AUTH_USER_INACTIVE = "auth.user_inactive"
    AUTH_ADMIN_ACCESS_DENIED = "auth.admin_access_denied"

    ADMIN_PROVIDER_CONFIG_UPDATED = "admin.provider_config_updated"
    ADMIN_MODEL_PROFILE_CREATED = "admin.model_profile_created"
    ADMIN_MODEL_PROFILE_UPDATED = "admin.model_profile_updated"
    ADMIN_MODEL_PROFILE_DELETED = "admin.model_profile_deleted"
    ADMIN_RUNTIME_SETTINGS_UPDATED = "admin.runtime_settings_updated"

    ADMIN_DOMAIN_CREATED = "admin.domain_created"
    ADMIN_DOMAIN_STARTED = "admin.domain_started"
    ADMIN_DOMAIN_STOPPED = "admin.domain_stopped"
    ADMIN_DOMAIN_DELETE_REQUESTED = "admin.domain_delete_requested"
    ADMIN_DOMAIN_DELETE_COMPLETED = "admin.domain_delete_completed"

    ADMIN_SOURCE_UPLOAD_ACCEPTED = "admin.source_upload_accepted"
    ADMIN_SOURCE_PREPARATION_RETRIED = "admin.source_preparation_retried"
    ADMIN_SOURCE_PREPARATION_CANCELLED = "admin.source_preparation_cancelled"
    ADMIN_SOURCE_INDEX_RETRIED = "admin.source_index_retried"
    ADMIN_SOURCE_INDEX_CANCELLED = "admin.source_index_cancelled"
    ADMIN_SOURCE_DELETE_REQUESTED = "admin.source_delete_requested"
    ADMIN_SOURCE_DELETE_COMPLETED = "admin.source_delete_completed"
    ADMIN_LIGHTRAG_DIAGNOSTICS_VIEWED = "admin.lightrag_diagnostics_viewed"
```

No turn-by-turn user chat audit. Normal member questions are not security/admin audit events.

## 8.1 Safe metadata allowlist

| Event family | Safe metadata allowed |
| --- | --- |
| Auth failure | `username_fingerprint`, `failure_kind` |
| Session rejected | `failure_kind` only |
| Admin access denied | `route_name`, `http_method` |
| Provider config | `provider_kind`, `configured` |
| Model profile | `profile_id`, `purpose`, `provider_kind` |
| Runtime settings | `active_synthesis_profile_id`, `active_parser_kind` |
| Domain lifecycle | `domain_id`, `operation_id`, `safe_outcome` |
| Source lifecycle | `domain_id`, `source_id`, `operation_id`, `safe_outcome` |
| LightRAG diagnostics viewed | `domain_id`, `operation_id`, `safe_outcome`, `line_count` |

Rules:

```text
No display-name/title/filename in audit metadata.
No domain runtime URL.
No controller payload.
No provider model ID when it may itself be sensitive deployment information.
No stack trace.
No raw request body.
No stored user question.
No source content.
No external provider URL or track ID in audit metadata.
```

## 8.2 Audit write boundary

```text
Successful admin mutation
  -> service writes domain/source/config record + audit row in same DB transaction.

Delete completion worker
  -> worker writes completion result + audit row in same guarded transaction.

Login result
  -> AuthenticationService writes session change and event in same transaction where possible.

Denied admin request
  -> `require_admin` writes a short independent audit record.
  -> audit failure never changes 403 into access.
```

No event bus. No outbox. No background writer.

---

# 9. Structured JSON Stdout Logging

## 9.1 One formatter

Implement with Python standard library only.

```text
app/core/logging.py
  -> configure JSON stdout handler.
  -> SafeJsonFormatter.
  -> log_event() helper.

app/core/log_context.py
  -> ContextVar-backed request/actor/trace context.
  -> bind_log_context().
  -> clear_log_context().
```

Do not add `structlog` only for this phase.

## 9.2 Log shape

Every application event emits one JSON object.

```json
{
  "timestamp": "2026-06-28T20:00:00Z",
  "level": "INFO",
  "logger": "context_engine.chat",
  "event": "chat.turn_completed",
  "request_id": "uuid",
  "trace_id": "uuid",
  "actor_kind": "member",
  "domain_id": "fatigue",
  "conversation_turn_id": "uuid",
  "safe_error_code": null,
  "elapsed_ms": 842
}
```

Required P0 fields stay when known. Optional fields are omitted when unknown.

```text
No null-filled giant payload.
No raw exception string.
No `extra` dumping.
No serializer fallback to repr(obj).
```

## 9.3 Request lifecycle

P1 request-ID middleware already owns request ID.

P8 extends it:

```text
request begins
  -> bind request_id, method, route template.

auth resolves user
  -> bind actor_kind + actor_user_id privately for logs.

P7 creates turn
  -> bind trace_id + conversation_turn_id.

request ends
  -> emit http.request_completed with status + elapsed_ms.
  -> clear context in finally.
```

No raw URL query string.

No request body.

No cookie header.

## 9.4 Required operational event names

Use stable dot-separated event names. Required P8/P5 additions:

```text
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
domain.operation.started
domain.operation.completed
domain.operation.failed
chat.turn.started
chat.retrieval.completed
chat.evidence.mapped
chat.synthesis.started
chat.turn.completed
chat.turn.failed
```

Rules:

```text
Use P0 base fields.
Add job_id, operation_id, external_provider, external_status, and duration_ms only when safe and known.
Do not log external provider URL, raw track response, raw diagnostic line, source title, source path, prompt, answer, or stack trace.
Cap free-form strings before formatter output.
```

## 9.5 Exception logging

Expected application errors:

```text
log safe_error_code + status.
Do not log exception text.
```

Unexpected errors:

```text
log event=unexpected_error
exception_type only
request_id
safe_error_code=internal_error
```

Do not emit raw stack trace in production logs by default. Local development may use debugger tooling outside this production log contract.

---

# 10. Native Audit Service

## 10.1 Lean module layout

```text
backend/app/
├── audit/
│   ├── events.py           # AuditEventName + typed safe metadata builders
│   └── service.py          # record(), client fingerprint, validation
│
├── core/
│   ├── config.py
│   ├── logging.py
│   └── log_context.py
│
├── observability/
│   └── tracing.py          # only direct Langfuse import
│
├── api/v1/
│   └── admin_audit_events.py
│
├── db/
│   ├── models/audit_event.py
│   └── repositories/audit_events.py  # SQL only
│
└── schemas/
    └── audit_events.py
```

No:

```text
audit_framework/
event_bus/
generic_event_store/
audit_worker/
observability_service/
langfuse_client.py outside tracing.py
telemetry_repository/
```

## 10.2 Service interface

```python
@dataclass(frozen=True)
class AuditRecord:
    event: AuditEventName
    actor_user_id: UUID | None
    target_kind: str | None
    target_id: str | None
    request_id: UUID | None
    trace_id: UUID | None
    safe_metadata: dict[str, str | bool | int | None]

class AuditService:
    def record(self, *, session: Session, record: AuditRecord, request: Request | None) -> UUID:
        ...
```

Rules:

```text
AuditRecord is built by application code, not browser input.
AuditService validates event-specific safe metadata keys.
Repository receives only validated record.
Repository does no fingerprinting, policy, auth, or HTTP work.
```

## 10.3 Client fingerprints

Use HMAC, not raw IP/user-agent.

```text
client_fingerprint
  = HMAC-SHA256(AUDIT_FINGERPRINT_KEY, normalized connection peer)[:24]

user_agent_fingerprint
  = HMAC-SHA256(AUDIT_FINGERPRINT_KEY, user-agent header)[:24]
```

Rules:

```text
No X-Forwarded-For parsing in P8.
No trust of browser-supplied IP headers.
Behind a reverse proxy, record the immediate trusted peer only until ingress proxy policy exists.
No raw IP or raw user agent stored.
```

---

# 11. Admin Audit API

All routes require `require_admin`.

```text
GET /api/v1/admin/audit-events
```

Request query parameters:

```text
limit             optional, default 50, max 100
event             optional exact AuditEventName
after             optional timestamp
before            optional timestamp
actor_user_id     optional UUID
```

No fuzzy search.

No free-text metadata query.

No query/body search.

Response:

```json
{
  "events": [
    {
      "id": "uuid",
      "event": "admin.domain_created",
      "actor": {"id": "uuid", "username": "admin"},
      "targetKind": "domain",
      "targetId": "fatigue",
      "requestId": "uuid",
      "traceId": null,
      "metadata": {"safeOutcome": "succeeded"},
      "createdAt": "2026-06-28T20:00:00Z"
    }
  ]
}
```

Rules:

```text
Actor is included when known.
This fixes the legacy audit-response omission of actor identity.
No client fingerprints in initial browser DTO.
No raw log/trace/prompt/source content.
No edit/delete endpoints.
No Langfuse proxy or dashboard link.
```

## 11.1 Admin LightRAG diagnostics API

P8 adds one optional admin-only diagnostic read path when P5 LightRAG runtimes
exist:

```text
GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag?tail=200
```

Purpose:

```text
help an admin diagnose a failed/stalled provider operation after a safe job record identifies the problem.
```

Rules:

```text
Requires require_admin.
Reads only through the P3/P5 lifecycle/controller boundary.
Never accepts a filesystem path, container name, provider URL, or track ID from the browser.
Maximum tail=200.
Maximum response size 64 KiB.
Unavailable is a safe response when the domain runtime is stopped.
Every successful or attempted diagnostics view writes admin.lightrag_diagnostics_viewed.
Response is not persisted in Postgres.
```

Redaction:

```text
Remove bearer tokens, API keys, cookies, connection strings, URLs with credentials,
configured secret patterns, stack-trace bodies, and long content-like lines.
Return only capped lines with safe timestamps/levels/messages.
```

No member API returns provider diagnostics.

---

# 12. Optional Langfuse Integration

## 12.1 Deployment decision

Default deployment:

```text
Context Engine compose
  -> no Langfuse containers.

LANGFUSE_ENABLED=false
  -> default local/dev/initial pilot behavior.
```

When enabled:

```text
Context Engine API sends telemetry to:
  managed Langfuse
  OR
  a separately operated Langfuse deployment.
```

Do not self-host Langfuse inside Context Engine compose.

Reason:

```text
Current Langfuse self-hosting infrastructure can include separate application/worker
components plus observability storage/queue dependencies. That conflicts with the P0
core target: one Postgres, no Redis/RQ, no extra worker type, and low operational entropy.
```

Self-hosted Langfuse later is an operator-owned, separate infrastructure decision. It never changes the Context Engine core compose shape.

## 12.2 Configuration

```dotenv
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=
LANGFUSE_CAPTURE_QUERY_TEXT=false
LANGFUSE_SHUTDOWN_FLUSH_SECONDS=2
AUDIT_FINGERPRINT_KEY=replace-with-long-random-secret
```

Rules:

```text
LANGFUSE_ENABLED=false
  -> Langfuse keys/host not required.

LANGFUSE_ENABLED=true
  -> public key, secret key, and host required.
  -> missing/invalid values fail startup safely.

AUDIT_FINGERPRINT_KEY
  -> required outside test.
  -> not reused from encryption/session/provider keys.
  -> never browser-visible/logged/stored in DB.

LANGFUSE keys
  -> deployment secrets only.
  -> never DB config.
  -> never browser-visible.
  -> never API response.
```

No:

```text
LANGFUSE per-domain config
LANGFUSE per-user config
LANGFUSE admin UI settings
LANGFUSE keys in P2 provider rows
LANGFUSE data in runtime files
```

## 12.3 One wrapper only

```text
app/observability/tracing.py
  -> imports Langfuse SDK when enabled.
  -> creates no-op objects when disabled.
  -> maps Context Engine safe metadata to SDK calls.
  -> catches export failures.
  -> exposes explicit manual spans.
```

Application code calls only:

```python
observability.start_trace(...)
observability.start_span(...)
observability.record_generation(...)
observability.record_error(...)
observability.flush(...)
```

No other module imports Langfuse.

No provider SDK drop-in replacement.

No broad auto-instrumentation.

Reason:

```text
Automatic provider instrumentation can capture prompt/response data by default.
P8 needs strict metadata-only default behavior.
```

## 12.4 Trace taxonomy

Root traces:

```text
chat.turn
retrieval.evidence_query
source.view_open
```

Chat child spans:

```text
rag.retrieve
lightrag.retrieve
evidence.map
synthesis.generate
turn.settle
```

Admin/source child spans only where useful and non-sensitive:

```text
lightrag.submit
lightrag.readiness
lightrag.delete
```

Do not trace:

```text
source parser payload
source image extraction
source raw text
controller Docker request/response
provider credential resolution
session cookie validation details
```

## 12.5 Metadata allowlist

Safe Langfuse metadata:

```text
trace_id
request_id
conversation_turn_id            # opaque UUID only
domain_id
result_kind                     # grounded_answer | evidence_only | no_grounded_context | failed | redacted
synthesis_profile_id             # UUID only
provider_kind                    # optional broad enum only
question_char_count
prior_question_count
raw_hit_count
mapped_evidence_count
discard_count_by_reason
citation_count
synthesis_attempt_count
safe_outcome_code
elapsed_ms
first_token_ms
token_usage_when_returned
cost_when_returned
```

Do not send:

```text
real username
email
user ID
source ID
block ID
evidence ID list
source title
source summary
raw question by default
raw answer
prompt
evidence excerpt
raw LightRAG result
storage/runtime path
provider secret
session/auth token
```

`evidence quality` in P8 means deterministic health counters:

```text
raw_hit_count
mapped_evidence_count
unmapped/ambiguous/foreign discard counts
citation validation drop count
no_grounded_context outcome
```

No subjective LLM quality score. No LLM-as-judge.

## 12.6 Opt-in sanitized question capture

Only when:

```text
LANGFUSE_ENABLED=true
AND
LANGFUSE_CAPTURE_QUERY_TEXT=true
```

may P8 export an `input.question` field.

Before export:

```text
1. normalize whitespace.
2. cap to 512 characters.
3. replace email-like strings -> [email].
4. replace phone-like digit runs -> [phone].
5. replace bearer/API-key-looking strings -> [secret].
6. replace UUID-like strings -> [id].
7. remove URL query strings -> URL origin/path only.
8. if redaction fails or output is empty -> omit text entirely.
```

Never export:

```text
system prompt
routing/classifier prompt from any deferred future chat mode
routing catalog
follow-up prompt
synthesis prompt
answer
citations
evidence
source text
```

This is a limited convenience feature, not a PII guarantee. Keep it disabled unless an operator explicitly accepts the data policy.

## 12.7 Error and shutdown behavior

```text
Langfuse export error
  -> record safe stdout event=observability.export_failed.
  -> do not call provider again.
  -> do not retry in application code.
  -> do not affect user response.

App shutdown
  -> bounded best-effort `flush()`.
  -> wait no longer than LANGFUSE_SHUTDOWN_FLUSH_SECONDS.
  -> then exit.
```

---

# 13. Instrumentation by Phase Boundary

## 13.1 P1 auth/session

| Event | Native audit | Stdout | Langfuse |
| --- | --- | --- | --- |
| Login success | Yes | Safe event | No |
| Login failure | Yes | Safe event | No |
| Invalid present session | Yes | Safe event | No |
| Inactive user | Yes | Safe event | No |
| Admin denial | Yes | Safe event | No |

No password, cookie, token, raw username, or user-agent text leaves Context Engine.

## 13.2 P2 runtime configuration

| Event | Native audit | Stdout | Langfuse |
| --- | --- | --- | --- |
| Provider credential updated | Yes, provider kind only | Safe event | No |
| Profile CRUD | Yes | Safe event | No |
| Active synthesis/parser changed | Yes | Safe event | No |

No credential/ciphertext/model request body in any layer.

## 13.3 P3 domain lifecycle

| Event | Native audit | Stdout | Langfuse |
| --- | --- | --- | --- |
| Domain create/start/stop | Yes | Safe event + latency | No |
| Domain delete requested | Yes | Safe event | No |
| Domain delete completed | Yes | Safe event + elapsed | No |

No runtime URL, Docker payload, workspace path, or database name.

## 13.4 P4/P5 source lifecycle

| Event | Native audit | Stdout | Langfuse |
| --- | --- | --- | --- |
| Source upload accepted | Yes | Safe event | No |
| Preparation retry/cancel | Yes | Safe event | No |
| Index retry/cancel | Yes | Safe event | No |
| Source delete requested/completed | Yes | Safe event | No |
| LightRAG submit/readiness/delete | No | Safe event | Optional metadata span |
| LightRAG health check | No | Safe event | No |
| LightRAG diagnostics viewed | Yes | Safe event | No |

Langfuse sees only duration, domain ID, source work outcome category, and counts. No filename, source text, parser output, external track ID, remote status payload, provider URL, or provider secret.

P8 stdout logs may include safe `external_provider=lightrag`, mapped state/stage,
`external_status`, latency, and safe outcome. They never include raw diagnostic
lines or raw provider responses.

## 13.5 P6 evidence query

```text
retrieval.evidence_query root trace
  -> lightrag.retrieve span
  -> evidence.map span
```

Metadata:

```text
domain_id
question_char_count
raw_hit_count
mapped_evidence_count
discard_count_by_reason
elapsed_ms
safe outcome
```

No question text by default. No raw hit. No source/block ID.

## 13.6 P7 modular chat

```text
chat.turn root trace
  -> P6 retrieval/evidence mapping
  -> synthesis.generate
  -> citation validation
  -> turn settlement
```

Rules:

```text
trace_id created at turn insert.
ChatTurnService binds trace_id to stdout context.
Tracing wrapper gets the same trace_id.
Turn row keeps trace_id even when Langfuse disabled.
No trace content enters member history API.
```

---

# 14. Deletion, Retention, and Data Boundaries

## 14.1 Source/domain hard delete

P0/P7 strict redaction stays unchanged:

```text
source delete
  -> grounded cited answers redacted.

domain delete
  -> grounded answers for domain redacted.
```

P8 Langfuse metadata contains no source text, source title, block ID, evidence list, or answer content by default.

Therefore:

```text
source/domain delete
  -> does not require Langfuse trace mutation in P8.
```

No raw document-derived content should remain remotely because P8 does not export it.

## 14.2 Audit events

```text
Audit events are immutable application accountability records.
No browser/API deletion endpoint.
No retention worker in P8.
```

At 5–10 users, the safe event volume is small. Formal retention and legal-hold policy are deferred until an actual business/compliance requirement exists.

## 14.3 Langfuse retention

Langfuse retention is deployment-owned.

```text
P8 sends metadata only by default.
Operator configures retention in managed/separate Langfuse deployment.
Context Engine does not implement a Langfuse retention API or cleanup worker.
```

---

# 15. API and Schema Contracts

## 15.1 No member API expansion

P8 does not add member-visible logs, traces, audit events, or observability state.

## 15.2 Admin route

```text
GET /api/v1/admin/audit-events
```

Requires `require_admin`.

## 15.3 Conversation history

Add no `traceId` field to member-safe history DTOs.

Keep existing P7 safe turn DTO shape.

## 15.4 Error contract

Use P1 canonical error envelope.

No new public Langfuse error code.

```text
Langfuse unavailable
  -> never becomes a member-facing failure.

audit list database failure
  -> normal safe internal_error / service_unavailable mapping.
```

---

# 16. Build Order

## Step 0 — Contract check

```text
Read P0/P1/P2/P3/P4/P5/P6/P7.
Confirm:
  P0 structured logging remains one schema.
  P1 opaque-cookie auth remains unchanged.
  P6 raw evidence stays request-scoped.
  P7 owns turn persistence and redaction.
  Langfuse stays optional metadata-only.
```

Write one short P0/P7 amendment note. Do not change unrelated phase contracts.

## Step 1 — Config and JSON logs

```text
Add AUDIT_FINGERPRINT_KEY.
Add Langfuse optional settings.
Implement SafeJsonFormatter.
Implement request/log context.
Extend request middleware safely.
```

Check:

```text
all process logs JSON.
request_id present.
no cookie/password/token/raw body.
context clears after request.
```

## Step 2 — Migration 0008

```text
Create audit_events.
Add conversation_turns.trace_id nullable.
Add narrow indexes.
Run fresh-upgrade test.
```

Check:

```text
no query_logs table.
no event/outbox queue.
no unexpected extension requirement.
```

## Step 3 — Audit module and P1 wiring

```text
Implement AuditEventName.
Implement validated metadata builders.
Implement AuditRepository.
Implement AuditService fingerprints.
Wire login success/failure/inactive/session-rejected/admin-denied.
```

Check:

```text
success/failure writes exact safe record.
no raw username password cookie IP or user agent stored.
admin denial stays 403 if audit write fails.
```

## Step 4 — Admin action audit wiring

```text
Wire P2 config mutations.
Wire P3 domain lifecycle actions.
Wire P4/P5 source lifecycle actions.
Use same mutation transaction for successful admin writes.
```

Check:

```text
one successful action -> one audit event.
failed transaction -> no successful audit event.
delete completion emits completion once after guarded finalization.
```

## Step 5 — Admin audit read API

```text
Add GET /admin/audit-events.
Safe filters.
Safe DTO includes actor when known.
OpenAPI snapshot.
```

Check:

```text
anon 401.
member 403.
admin 200.
no client fingerprint returned.
```

## Step 6 — LightRAG job/status diagnostics

```text
Confirm P5 source/index jobs expose safe state/stage fields.
Persist external_provider/external_track_id/external_status on accepted LightRAG submissions.
Map provider status to Context Engine state/stage.
Add bounded admin LightRAG diagnostics endpoint.
Add diagnostics-view audit event.
Add required stdout event names for document indexing and provider polling.
```

Check:

```text
member APIs never expose external_track_id, provider URL, raw status payload, or logs.
provider logs do not drive product state.
diagnostics endpoint is admin-only, bounded, redacted, and audited.
worker restart/reconciliation keeps the same request/job/provider correlation.
```

## Step 7 — Observability wrapper

```text
Add observability/tracing.py.
Noop behavior when disabled.
Enabled config validation.
Manual metadata-only trace/spans.
Bounded shutdown flush.
```

Check:

```text
only tracing.py imports Langfuse.
Langfuse disabled -> zero outbound calls.
Langfuse export failure -> app request succeeds.
```

## Step 8 — P6/P7 instrumentation

```text
Instrument evidence retrieval/map.
Instrument RAG-only synthesis.
Instrument citation validation and turn settlement.
Persist/bind trace_id on new turn.
```

Check:

```text
no raw question/answer/evidence/prompt span fields by default.
counts + latency + safe outcome present.
SSE contract unchanged.
```

## Step 9 — Documentation and recovery proof

```text
Write operator runbook.
Document managed/separate Langfuse topology.
Document disabled/enabled config.
Document trace-to-stdout correlation by trace_id.
Run full P1–P8 regression gate.
```

---

# 17. Test Gate

## 17.1 Unit tests

```text
SafeJsonFormatter serializes canonical safe fields.
Formatter does not repr arbitrary objects.
Context bind/clear does not leak across requests.
AuditEventName values are canonical.
Audit metadata rejects unexpected keys.
Audit fingerprint deterministic for same input + secret.
Audit fingerprint differs when HMAC key/input differs.
Fingerprint never stores raw IP/user agent.
No-op tracing makes no SDK/network call.
Langfuse enabled with missing keys/host fails startup.
Question sanitizer caps/redacts and never returns prompt/evidence/answer.
```

## 17.2 Authentication/audit integration

```text
login success -> one auth.login_succeeded audit row.
wrong password -> one auth.login_failed row; raw password absent.
inactive user -> auth.user_inactive; no session created.
present invalid session -> auth.session_rejected.
missing session -> no audit noise.
member direct admin request -> 403 + auth.admin_access_denied.
audit persistence failure on denial -> still 403.
```

## 17.3 Admin mutation integration

```text
provider config update -> safe audit event; no credential/ciphertext.
domain create/start/stop/delete -> correct audit lifecycle events.
source upload/retry/cancel/delete -> correct safe events.
transaction rollback -> no false success audit event.
delete completion retry -> no duplicate completion event after guarded success.
```

## 17.4 Audit API tests

```text
anon -> 401.
member -> 403.
admin -> safe paginated response.
actor identity returned when known.
unknown login failure actor remains null.
client/user-agent fingerprint never returned.
filter limits validated.
no raw metadata query endpoint.
```

## 17.5 P5 LightRAG/status diagnostics tests

```text
accepted LightRAG submission stores external_provider and external_track_id on the P5 job.
provider status maps to Context Engine state/stage without leaking raw status to member DTOs.
provider failure stores safe_error_code and capped safe_diagnostics only.
provider track lost after reconciliation window fails safely as provider_track_lost.
worker restart reconciles waiting_provider job by polling existing external_track_id.
admin diagnostics endpoint requires admin.
member diagnostics request returns 403/no data.
diagnostics response is capped, redacted, and not persisted.
diagnostics view writes admin.lightrag_diagnostics_viewed audit event.
JSON stdout contains document.index.* and lightrag.* events with request/job correlation.
```

## 17.6 P6/P7 tracing tests

```text
new chat turn gets internal trace_id.
member history does not expose trace_id.
Langfuse disabled -> chat/evidence succeeds with no SDK call.
metadata-only trace contains expected counts/latencies/outcomes.
trace excludes raw question, answer, prompt, evidence, titles, source IDs, paths, secrets.
Langfuse exporter error -> retrieval/chat still succeeds.
RAG-only chat traces safe retrieval/synthesis outcome only.
RAG/single-shot trace has one retrieval span.
source deletion redaction still works with tracing enabled.
```

## 17.7 Static and architecture tests

```text
No direct `langfuse` import outside observability/tracing.py.
No query_logs model/migration/route.
No Redis/RQ/Celery worker added by P8; no OTEL collector or Langfuse compose service.
No raw LightRAG client import outside the P5 adapter package.
No provider status string rendered directly by frontend/member DTOs.
No provider diagnostics route without require_admin.
No provider drop-in instrumentation import.
No PII/raw-content fields in trace metadata builder.
```

## 17.8 Required command gate

```text
format/lint
type check
unit tests
Postgres integration tests
Alembic fresh-upgrade test
OpenAPI snapshot test
SSE end-to-end test
compose smoke test
lightweight expected-load test for 5-10 concurrent users
dependency-failure test for provider timeout/rate limit, worker unavailable, DB unavailable, and invalid upload
secret scan
P1-P7 regression suite
```

## 17.9 Launch-readiness load and failure checks

```text
Smoke: login -> authenticated read -> admin denied/allowed route checks.
Expected load: 5-10 concurrent users across domain list, evidence query, and streamed chat.
Admin write overlap: one admin upload/index job while members query another domain.
Failure: provider timeout/rate limit returns safe typed error or evidence-only fallback.
Failure: worker unavailable leaves durable queued/failed state without blocking API workers.
Failure: DB unavailable returns safe service_unavailable and recovers after DB returns.
Failure: invalid upload fails validation without parser execution.
Metrics captured: p95 evidence latency, p95 first-token latency, error rate, DB pool usage, worker queue age, runtime memory, provider timeout/rate-limit count, disk growth.
```

Do not treat 50 users as supported until this gate is expanded and passes on the actual target environment.

---

# 18. Operator Runbook

## 18.1 Local default

```text
LANGFUSE_ENABLED=false
```

Expected:

```text
JSON stdout logs.
Postgres audit events.
No outbound Langfuse traffic.
No missing-key startup failure.
```

## 18.2 Enable Langfuse

```text
1. Choose managed Langfuse or an independently operated deployment.
2. Set Langfuse deployment secrets in API environment.
3. Set LANGFUSE_ENABLED=true.
4. Keep LANGFUSE_CAPTURE_QUERY_TEXT=false.
5. Restart API.
6. Submit one safe test turn.
7. Confirm metadata-only trace by trace_id.
8. Confirm chat still works after deliberately blocking Langfuse egress.
```

## 18.3 Diagnose a chat turn

```text
1. Obtain internal request_id or conversation turn ID from safe admin/operator context.
2. Find JSON stdout event with matching request_id/trace_id.
3. If enabled, search Langfuse by trace_id.
4. Compare safe outcome, span durations, raw-hit count, mapped-evidence count,
   citation count, and synthesis attempt count.
5. Do not retrieve prompt/source content from logs because P8 does not export it.
```

## 18.4 Diagnose failed LightRAG indexing

```text
1. Start from the Context Engine source/job/operation row, not provider logs.
2. Use request_id/job_id/operation_id to find JSON stdout document.index.* events.
3. Check external_provider, safe external_status, safe_error_code, and provider_last_seen_at.
4. If needed, admin may fetch bounded LightRAG diagnostics for the domain.
5. Confirm the diagnostics view created admin.lightrag_diagnostics_viewed audit event.
6. Retry only through the P5 retry operation, never by resubmitting raw provider calls manually.
```

Do not paste raw provider logs, source content, track responses, or secrets into task notes.

## 18.5 Audit review

```text
Admin -> GET /api/v1/admin/audit-events.
Review actor, event, target, request ID, safe metadata, timestamp.
Use request_id to correlate JSON stdout.
Do not treat Langfuse as evidence of security/audit history.
```

---

# 19. Configuration

```dotenv
# Existing
LOG_LEVEL=INFO

# P8 native audit
AUDIT_FINGERPRINT_KEY=replace-with-long-random-secret

# P8 optional Langfuse
LANGFUSE_ENABLED=false
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_HOST=
LANGFUSE_CAPTURE_QUERY_TEXT=false
LANGFUSE_SHUTDOWN_FLUSH_SECONDS=2
```

No:

```text
LANGFUSE model/provider settings
LANGFUSE per-domain settings
LANGFUSE per-user settings
LANGFUSE sampling controls in browser
AUDIT event retention setting
AUDIT metadata schema config
```

---

# 20. Explicitly Deferred

```text
self-hosting Langfuse inside project infrastructure
custom audit dashboard
SIEM export
alerts
compliance retention/hold policy
IP reputation/geo lookup
login rate-limiter implementation beyond P0 ingress limit
MFA/SSO
admin user management
OpenTelemetry collector
metrics dashboards
LLM-as-judge
quality scoring
human feedback workflow
prompt management
document/content tracing
full text capture approval workflow
```

---

# 21. Definition of Done

```text
Context Engine has one immutable native audit table.
Audit records auth and admin/security actions with safe fields only.
Admin can list audit events and sees actor identity when known.
All runtime logs are structured JSON with request correlation.
New chat turns receive an internal neutral trace_id.
Langfuse is optional, off by default, metadata-only, and isolated behind one wrapper.
Langfuse outage does not block auth, upload, retrieval, chat, SSE, source deletion, or domain deletion.
LightRAG provider status is mapped through P5 and never becomes the public status vocabulary.
Admin LightRAG diagnostics are bounded, redacted, audited, and never persisted by default.
No raw prompt/question/answer/evidence/source content leaves Context Engine by default.
No query_logs table, Redis/RQ/Celery worker added by P8, collector, custom dashboard, or Langfuse core compose service exists.
P0-P7 security, eligibility, exact mapping, session, streaming, RAG-only chat, and hard-delete redaction contracts remain intact.
Pilot launch gate includes lightweight expected-load, dependency-failure, recovery, and secret-scan evidence.
```

## Final Boundary

```text
P1–P7
  -> trusted application, source lifecycle, LightRAG, evidence, chat.

P8
  -> native audit + JSON stdout + optional safe Langfuse metadata traces.

Not P8
  -> an observability platform, SIEM, dashboard, prompt archive, query-log warehouse,
     self-hosted telemetry stack, or agent evaluation system.
```
