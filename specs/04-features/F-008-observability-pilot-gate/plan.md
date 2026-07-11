---
id: F-008
title: Observability And Pilot Gate Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-007]
supersedes: []
---


# F-008 - Implementation Plan

## Build Strategy

Build only P8 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

Before backend implementation, use the active contracts as authority:

- DATA-001 for audit schema, event enum, safe metadata, same-transaction audit, request/operation correlation, and private trace ids.
- API-001 for audit and diagnostics route DTOs/errors/authz.
- EVT-001 for the no-SSE-drift rule.
- QA-003 for logging, tracing, diagnostics redaction, and safety scans.
- RUN-001/QA-004 for pilot launch, failure injection, compose smoke, and expected-load proof.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | No P8 UI. F-009 may later read admin audit metadata; F-010/shared-node-operations owns Logs/Usage/operator surfaces when formalized. Observability cannot alter P1-P7 product outcomes. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | `audit_events`; private nullable trace id metadata on chat turns; nullable origin `request_id` on `domain_operations` and `source_preparation_operations`; existing `source_documents.index_request_id` for source-index correlation. No `query_logs` table. |
| Worker/runtime | Workers log persisted origin `request_id` plus operation ids. Native `LightRAGClient` lifecycle operations are process-serialized globally until pinned concurrency proof allows a per-domain guard. LightRAG diagnostics use backend-owned, redacted, domain-scoped diagnostic material only. Live Docker controller gate remains named; P8 compose readiness uses the approved local compose-replacement smoke until deployment compose exists. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs, closed audit events, optional no-op tracing wrapper, chat-only private trace ids, and diagnostics only through backend-owned boundaries. |

## Locked P8 Decisions

- JSON logs are required in dev, test, and production.
- Every API request gets a server `request_id`. Originating request ids are persisted on `domain_operations` and `source_preparation_operations`; source indexing continues to use `source_documents.index_request_id`.
- `trace_id` is created for chat turns only. Admin mutations correlate through `request_id`, audit event id, and target id, not broad trace ids.
- Implement the full P8 `AuditEventName` set. Audit reads self-audit as `audit_events.read`; the default audit route may hide those rows unless explicitly filtered.
- Langfuse is a no-op wrapper by default. If enabled, it uses the Context Engine `trace_id` and safe metadata only; outages are ignored.
- LightRAG diagnostics are optional. If implemented, prefer a redacted per-domain runtime log/tail owned by the backend. Do not pipe host-side native LightRAG logs into current domain container logs for P8.
- Native `LightRAGClient` uses a global process-local lifecycle guard for `vendor/lightrag/1.4.16`. Per-domain lifecycle locking is deferred until a later phase proves different domains can safely run native LightRAG work concurrently.
- Logs/Usage UI, cost/storage views, and operator dashboards are deferred to future F-010/shared-node-operations scope.

## Implementation Sequence

- [x] T-005 [docs/contracts] Promote and lock P8 review decisions into source-of-truth contracts.
  - Verification: DATA-001, API-001, EVT-001, QA-003, QA-004, RUN-001, F-008 docs, and feature register aligned before code.
- [x] T-006 [backend/runtime] Add a global native LightRAG lifecycle guard and keep per-domain locking deferred.
  - Verification: Focused lifecycle guard test proves two native client instances cannot enter the native lifecycle region concurrently.
- [x] T-010 [backend/data/service] Add audit event migration, operation `request_id` fields, chat `trace_id`, enum, and service.
  - Verification: Fresh migration, audit rollback, private chat trace id, and safe metadata tests pass in `tests/test_observability.py`.
- [x] T-020 [backend] Instrument full P8 admin/security audit coverage.
  - Verification: Admin audit read, denied admin route, provider credential rotation, domain/source mutation, index retry/cancel, and redaction audit coverage are implemented and covered by focused and regression tests.
- [x] T-030 [backend/ops] Add structured JSON logging and request context propagation.
  - Verification: JSON log redaction/context and async operation correlation tests pass.
- [x] T-040 [backend/ops] Add optional tracing wrapper and safe metadata policy.
  - Verification: Disabled/default no-op and outage behavior tests pass.
- [x] T-050 [backend/api] Add admin audit route and optional LightRAG diagnostics/log tail route.
  - Verification: Admin audit route and backend-owned LightRAG diagnostics tail are implemented and tested with redaction, bounds, success audit, and unavailable failure audit.
- [x] T-060 [ops/test] Run pilot launch gate and expected-load test.
  - Verification: `scripts/compose_smoke.py` is the approved local compose-replacement smoke; `scripts/pilot_flow.py` proves full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact -> domain delete; deterministic expected-load and failure-injection tests pass.

## Migration And Rollback

- Schema change: yes, additive only.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.
P8 schema scope is limited to creating `audit_events`, adding nullable private `conversation_turns.trace_id`, and adding nullable origin `request_id` to `domain_operations` and `source_preparation_operations`.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
- False pilot readiness: acceptance must record real evidence for compose-replacement, load, and failure gates; deployment-specific compose remains future environment work outside P8.
- Native LightRAG concurrency: keep the global lifecycle guard until `vendor/lightrag/1.4.16` concurrency tests prove per-domain locking is safe.
- LightRAG logger routing: if logger configuration cannot be kept domain-scoped, redacted, and deterministic, defer diagnostics/log capture instead of adding global or cross-domain log plumbing.
