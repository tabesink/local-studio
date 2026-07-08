---
id: QA-003
title: Observability
status: approved
owner: Context Engine operations team
last_reviewed: 2026-07-06
depends_on: [QA-002]
supersedes: []
---

# Observability

## Layers

| Layer | Purpose | Truth |
| --- | --- | --- |
| `audit_events` | security/admin accountability | audit truth |
| JSON stdout | runtime/operator diagnostics | diagnostic evidence |
| Restricted LightRAG runtime log/tail | optional backend-only diagnostics source | diagnostic evidence, never audit truth |
| Optional Langfuse | RAG/LLM timing and metadata debug | never audit truth |

## Required Safe Log Fields

`timestamp`, `level`, `logger`, `event`, `request_id`, `trace_id`, `actor_kind`, `domain_id`, `source_id`, `conversation_turn_id`, `operation_id`, `client_request_id`, `index_request_id`, `safe_error_code`, `elapsed_ms`, `http_method`, `http_route`, `http_status`, `outcome`, `replay`.

Do not log raw IP, raw user agent, raw body, filename/title/display name, secret, path, provider URL, provider track ID, stack trace, prompt, question, answer, source text, or raw evidence.

## Audit Policy

- `audit_events` is the only P8 audit truth.
- Logs, restricted LightRAG runtime tails, and optional Langfuse traces are diagnostic evidence only.
- Audit events use the closed `AuditEventName` set in DATA-001.
- Protected admin/security mutations commit the product state change and audit row in the same database transaction.
- If audit write fails for a protected admin/security mutation, the mutation rolls back and the API returns a safe failure.
- Public unauthenticated auth failures are safe-log only.
- Authenticated Member denial on admin routes emits `security.admin_route_denied`.
- Audit reads are self-audited as `audit_events.read`; the default API list may omit those rows unless explicitly filtered.

## Log Context Policy

All environments use JSON logs: dev, test, and production. Human-readable console formatting is not the P8 default.

Every API request gets a server-generated `request_id`. Request context must propagate into service calls, worker claims, and SSE generators through explicit context plumbing, not globals that can leak across concurrent requests.

Allowed log events are implementation-owned but must use stable lower_snake_case or dotted names and the safe fields above. Production logs record safe error codes and typed exception categories only; raw exception messages and tracebacks are forbidden.

Log context must not widen product contracts:

- P7 idempotent replay logs `replay=true` and must not call provider, LightRAG, or the P6 retriever again.
- SSE context hooks must not alter EVT-001 event names, ordering, or payloads.
- Worker logs include safe operation ids, statuses, and the persisted origin `request_id` when present.
- Chat turn logs are milestone-only: claimed, routed, retrieval_started, retrieval_finished, provider_started, provider_finished, persisted, replayed, failed, or cancelled. They never log message text, prompts, answers, evidence excerpts, or raw provider/LightRAG payloads.

## Trace Policy

Tracing is disabled by default. Optional Langfuse support must be isolated behind one tracing module and must degrade to a no-op when disabled or unavailable. Tracing outage is safe-logged and ignored; core product behavior continues.

Only the tracing wrapper module may import optional tracing provider packages. Product services call an internal tracing port/wrapper, not Langfuse directly.

P8 `trace_id` is created for chat turn execution only, persisted on `conversation_turns`, and reused on idempotent replay. If Langfuse is enabled, the Context Engine `trace_id` is the provider trace id. Admin mutations use `request_id`, audit event id, and target id for correlation, not broad trace ids.

Allowed trace metadata:

```text
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

Trace metadata must not include prompts, user questions, assistant answers, source text, evidence excerpts, provider payloads, raw LightRAG hits, runtime targets, storage targets, stack traces, filenames, titles, display names, credentials, or browser-supplied private targets.

## Diagnostics Policy

Admin diagnostics are optional P8 delivery. If implemented, diagnostics are backend-targeted, administrator-only, redacted, bounded, and audited. The browser may request only approved route parameters such as `tail`; it never supplies a path, URL, container, provider, runtime, storage, or credential target.

Diagnostics redaction tests must use synthetic sentinel strings. Fixtures must not store real provider output, runtime output, source text, prompts, answers, private paths, runtime addresses, or credential material.

LightRAG logging posture:

- If LightRAG runs in-process, prefer a backend-owned, domain-scoped, sanitized diagnostic log file/tail under the private runtime area. The diagnostics route may read only the bounded, post-redaction tail.
- Do not pipe host-side native LightRAG logs into current domain container stdout/stderr for P8. That couples diagnostics to the wrong boundary and can lose domain context.
- If a future phase runs a real per-domain LightRAG service/container, that phase may choose stdout and/or a mounted `/ce-runtime/logs/lightrag.log` file through an explicit contract patch.
- If domain-scoped redacted logging is not cheap and deterministic during P8, defer diagnostics/log capture and record the limitation instead of adding global logger plumbing.

## Safety Scan Scope

P8 acceptance must include an automated or explicit manual safety scan over audit API responses, log snapshot fixtures, tracing test payloads, diagnostics responses, optional LightRAG runtime log/tail fixtures, OpenAPI examples, and acceptance evidence artifacts. The scan must check for secret material, raw request bodies, prompts, user questions, assistant answers, source text, evidence excerpts, raw provider payloads, raw LightRAG payloads, runtime targets, storage targets, stack traces, and private source/block ids in public surfaces.

P8 v1 does not persist or log raw IP, raw user agent, or derived IP/user-agent fingerprints. Adding fingerprints requires a later DATA-001 and QA-003 patch for HMAC key source, rotation, retention, and DTO omission rules.
