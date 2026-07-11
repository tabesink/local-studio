# P8 - Observability And Pilot Gate

Goal: enough audit, logs, diagnostics, tracing, and release proof for 5-10 user internal pilot.

## Build

- immutable `audit_events`.
- `AuditEventName` enum.
- `AuditService`.
- admin audit read route.
- JSON stdout logging.
- request/log context helper.
- optional neutral `trace_id` on new chat turns.
- safe LightRAG/provider diagnostics through P3/P5 boundary.
- optional Langfuse wrapper.
- no-op tracing when disabled.
- metadata-only manual spans.
- operator runbook.
- launch gate tests.

## Three Layers

| Layer | Job |
| --- | --- |
| `audit_events` | security/admin accountability |
| JSON stdout | runtime/operator diagnostics |
| Langfuse optional | RAG/LLM timing and metadata debug |

Langfuse is not audit truth. Logs are not product truth. Provider logs are not product state.

## Resolved Tensions

- No `query_logs`.
- No generic event warehouse.
- No Langfuse in core Compose.
- No self-host telemetry stack inside Context Engine.
- No raw prompt/question/answer/evidence/source content by default.
- No provider status strings in member DTOs.
- P8 may add safe diagnostic fields to existing P5-owned rows, not a new job platform.

## Audit

`audit_events` stores:

- event enum
- actor user id when known
- target kind/id
- request id
- trace id
- HMAC client/user-agent fingerprints
- strict safe metadata
- created at

Never store raw IP, raw user agent, raw body, filename/title/display name, secret, path, provider URL, provider track ID, stack trace, prompt, question, answer, source text.

Admin route:

```text
GET /api/v1/admin/audit-events
```

No edit/delete route.

## Logs

JSON stdout fields:

```text
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
```

No raw exception text in production logs. Use `exception_type` + request ID.

## Langfuse

Default:

```text
LANGFUSE_ENABLED=false
LANGFUSE_CAPTURE_QUERY_TEXT=false
```

Only `observability/tracing.py` imports Langfuse.

Allowed metadata:

- trace id
- request id
- turn id
- domain id
- result kind
- synthesis profile id
- provider kind enum
- question char count
- prior question count
- raw hit count
- mapped evidence count
- discard counts
- citation count
- latency
- token/cost metadata if provider returns it

Question text capture needs explicit operator approval. Even then cap/redact first. Never export answer, prompt, evidence excerpt, source text, title, source/block IDs, storage path, runtime path, provider secret.

Langfuse outage never blocks auth, upload, retrieval, chat, SSE, source delete, or domain delete.

## Diagnostics

Optional admin-only:

```text
GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag?tail=200
```

Rules:

- Administrator only.
- through controller/P5 boundary only.
- no browser-provided path/container/URL/track ID.
- max 200 lines, 64 KiB.
- redacted.
- audited.
- not persisted.

## Launch Gate

Before pilot:

- format/lint.
- type checks.
- unit tests.
- Postgres integration tests.
- Alembic fresh-upgrade test.
- OpenAPI snapshot test.
- secret scan.
- compose smoke.
- SSE end-to-end.
- full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete -> restore proof.
- expected-load test for 5-10 concurrent users.
- dependency failure tests:
  - provider timeout/rate limit
  - worker unavailable
  - DB unavailable
  - invalid upload

Do not claim 50 users without benchmark evidence on target hardware/provider quotas/data size.

## Do Not Build

- custom dashboard
- SIEM export
- alerts
- compliance retention policy
- OpenTelemetry collector
- metrics stack
- self-host Langfuse in core compose
- prompt management
- evals/LLM judge
- feedback workflow
- full content tracing
- audit retention worker

## Done

Safe audit exists. Structured logs exist. Optional tracing exists and is isolated. Pilot launch gate has real evidence. P1-P7 behavior unchanged.

