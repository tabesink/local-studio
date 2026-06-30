---
id: F-008
title: Observability And Pilot Gate Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-007]
supersedes: []
---


# F-008 - Observability And Pilot Gate

Phase: P8

## Outcome

Add safe audit, structured logs, diagnostics, optional tracing, and launch evidence for a 5-10 user internal pilot without changing P1-P7 behavior.

## Why Now

The pilot needs accountability and diagnostic evidence without exposing sensitive source, prompt, provider, or runtime details.

## Actors

Administrators, operators, reviewers, optional tracing system.

## In Scope

- `audit_events` immutable table.
- `AuditEventName` enum and `AuditService`.
- Admin audit read route.
- JSON stdout logging and request/log context helper.
- Optional neutral `trace_id` on chat turns.
- Safe LightRAG/provider diagnostics through P3/P5 boundaries.
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

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | `audit_events` stores safe immutable admin/security metadata only. | DATA-001, QA-003 |
| FR-002 | JSON logs use safe fields and no raw exception text in production. | QA-003 |
| FR-003 | Langfuse is disabled by default and metadata-only when enabled. | QA-003 |
| FR-004 | Diagnostics are admin-only, redacted, bounded, audited, and not path/URL driven by browser. | API-001, QA-002 |
| FR-005 | Pilot launch gate proves full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact flow. | DEL-002 |

## Contracts And Data

- Contracts: API-001, DATA-001, QA-003, DEL-002
- Data: `audit_events`; optional trace id metadata on chat turns. No `query_logs` table.

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

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
