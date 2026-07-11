---
id: F-008
title: Observability And Pilot Gate Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-007]
supersedes: []
---


# F-008 - Observability And Pilot Gate

Phase: P8

## Outcome

Add safe audit, request/operation correlation, JSON logs, private chat trace correlation, optional diagnostics/tracing, and launch evidence for a 5-10 user internal pilot without changing P1-P7 behavior.

## Why Now

The pilot needs accountability and diagnostic evidence without exposing sensitive source, prompt, provider, or runtime details.

## Actors

Administrators, operators, reviewers, optional tracing system.

## In Scope

- `audit_events` immutable table.
- `AuditEventName` enum and same-transaction `AuditService`.
- Admin audit read route with bounded filters.
- JSON stdout logging in dev/test/prod and request/log context helper.
- Server-generated request id for every API request.
- Originating `request_id` persisted on async operation rows that already exist: `domain_operations` and `source_preparation_operations`.
- Source-index correlation through existing `source_documents.index_request_id` plus Source Document id; no new source-index operations table in P8.
- Private neutral `trace_id` on chat turns.
- Optional safe LightRAG diagnostics through backend-owned P3/P5 boundaries.
- Optional redacted per-domain LightRAG runtime log capture when cheap to implement.
- Global native LightRAG lifecycle guard in `LightRAGClient`; per-domain native lifecycle guard is deferred until `vendor/lightrag/1.4.16` concurrency proof passes.
- Optional Langfuse wrapper isolated to tracing module.
- Operator runbook and launch gate tests.

## Out Of Scope

- custom dashboard
- SIEM export
- alerts
- compliance retention policy
- OpenTelemetry collector
- metrics stack
- self-host Langfuse in core compose
- prompt management
- LLM judge evals
- full content tracing
- audit retention worker
- Logs/Usage UI, operator dashboard, cost accounting, or log viewer
- forcing host-side LightRAG logs into current domain container stdout/stderr
- converting the current private runtime boundary into a per-domain LightRAG service/container
- switching to per-domain in-process native LightRAG lifecycle locking without a pinned concurrency proof
- generic event warehouse, log database, or queue-backed observability bus

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | `audit_events` stores safe immutable admin/security metadata only. | DATA-001, QA-003 |
| FR-002 | JSON logs use safe fields and no raw exception text in production. | QA-003 |
| FR-003 | Langfuse is disabled by default and metadata-only when enabled. | QA-003 |
| FR-004 | Diagnostics are admin-only, redacted, bounded, audited, and not path/URL driven by browser. | API-001, QA-002 |
| FR-005 | Pilot launch gate proves full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact flow. | DEL-002 |
| FR-006 | P8 request/log/trace context does not change P7 conversation DTOs or EVT-001 SSE payloads. | API-001, EVT-001 |
| FR-007 | Async workers log persisted origin `request_id` plus operation id; logs alone are not the correlation source of truth. | DATA-001, QA-003 |
| FR-008 | New chat turn execution gets a private `trace_id`; idempotent replay reuses the persisted trace id and does not expose it in public DTO/SSE payloads. | DATA-001, API-001 |
| FR-009 | Audit reads are self-audited; default audit queries may hide `audit_events.read` unless explicitly filtered. | API-001, DATA-001 |
| FR-010 | LightRAG diagnostics/log capture, if shipped, is a bounded redacted backend tail of domain-scoped diagnostic material, not audit truth. | API-001, QA-003 |
| FR-011 | Logs/Usage UI notes are deferred to future F-010/shared-node-operations scope and are not P8 implementation blockers. | README |
| FR-012 | Native `LightRAGClient` serializes `vendor/lightrag/1.4.16` lifecycle operations process-wide until a later per-domain guard is proven by concurrency tests. | ARCH-002, QA-004 |

## Contracts And Data

- Contracts: API-001, EVT-001, DATA-001, QA-002, QA-003, QA-004, DEL-002, RUN-001, PROD-004, ARCH-002
- Data: `audit_events`; private nullable trace id metadata on chat turns; nullable originating `request_id` on `domain_operations` and `source_preparation_operations`; existing `source_documents.index_request_id` for source-index work. No `query_logs` table.

## Source-Of-Truth Decisions

- DATA-001 owns the `audit_events` schema, `AuditEventName` enum, safe metadata allowlist, same-transaction audit rule, audit failure behavior, and private `conversation_turns.trace_id`.
- DATA-001 owns the correlation split: API `request_id`, P7 `client_request_id`, source index `index_request_id`, and chat-only private `trace_id`.
- API-001 owns `GET /admin/audit-events`, the optional LightRAG diagnostics route shape, admin-only authorization, error codes, and the rule that trace ids are not public DTO fields.
- EVT-001 owns the no-SSE-drift rule for P8 request/log/trace context.
- QA-003 owns JSON-everywhere logs, safe log fields, exception logging policy, trace metadata allowlist, tracing import isolation, diagnostics redaction, LightRAG runtime-log handling, and safety scan scope.
- ARCH-002 owns the native LightRAG lifecycle guard: global process serialization now; per-domain serialization only after a pinned concurrency proof.
- RUN-001 and QA-004 own pilot launch evidence, compose smoke, expected-load, and failure-injection proof.
- F-010/shared-node-operations, when formalized, owns any Logs/Usage UI, cost/storage views, scoped log browser, or operator dashboard. P8 emits safe data but does not build those surfaces.
- Review notes under `.devnotes/` are evidence only after these contracts are patched.

## Acceptance Criteria

- AC-001: format/lint/type checks
- AC-002: unit/integration/migration/OpenAPI tests
- AC-003: secret scan
- AC-004: compose smoke
- AC-005: SSE end-to-end
- AC-006: full pilot flow
- AC-007: 5-10 concurrent user load test
- AC-008: provider timeout/worker unavailable/DB unavailable/invalid upload tests

## Open Decisions

No open P8 product decisions remain for audit, request/operation correlation, safe logs, optional tracing, diagnostics DTOs, LightRAG log posture, or pilot evidence shape.

LightRAG diagnostics/log capture is implemented only as a bounded, redacted backend tail of a per-domain diagnostic file under the private runtime boundary. Missing diagnostic material returns `diagnostics_unavailable` and is audited; raw host/container logs remain out of scope.

P8 closes AC-004 through the approved local compose-replacement smoke command in RUN-001 because this repo still has no deployment compose fixture. Deployment-specific compose remains future environment work, not an open P8 backend decision.

If a backend/runtime/frontend contract is unknown during later implementation, create a fixture-capture task and keep that later feature blocked until evidence exists.
