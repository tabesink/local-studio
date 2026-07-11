---
id: F-008
title: Observability And Pilot Gate Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-007]
supersedes: []
---


# F-008 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [x] T-005 [docs/contracts] Align and lock P8 decisions into authoritative specs before implementation.
  - Verification: DATA-001, API-001, EVT-001, QA-003, QA-004, RUN-001, F-008 docs, and feature register carry the decisions.
- [x] T-006 [backend/runtime] Add global native LightRAG lifecycle guard and document per-domain guard deferral.
  - Verification: `test_native_lightrag_client_uses_global_lifecycle_guard`.
- [x] T-010 [backend/data/service] Add audit event migration, operation `request_id` fields, chat `trace_id`, enum, and service.
  - Verification: `tests/test_observability.py` covers the fresh migration, audit rollback, safe metadata, and private chat trace id behavior.
- [x] T-020 [backend] Instrument full P8 admin/security audit coverage.
  - Verification: `tests/test_observability.py` covers admin audit reads, member denial audit, provider credential rotation audit, domain/source operation request ids, and redaction audit paths.
- [x] T-030 [backend/ops] Add structured JSON logging context and async request propagation.
  - Verification: `tests/test_observability.py` covers JSON log formatting/redaction and worker/request correlation; regression suites keep domain/source/index/chat behavior intact.
- [x] T-040 [backend/ops] Add optional tracing wrapper and safe metadata policy.
  - Verification: `tests/test_observability.py` covers disabled/outage behavior and safe tracing metadata.
- [x] T-050 [backend/api] Add admin audit route and optional LightRAG diagnostics/log tail route.
  - Verification: Admin audit route authz, bounds, self-audit, diagnostics safe tail/unavailable behavior, and redaction are covered.
- [x] T-060 [ops/test] Run pilot launch gate and expected-load test.
  - Verification: `scripts/compose_smoke.py`, `scripts/pilot_flow.py`, and `test_expected_load_smoke_for_ten_authenticated_direct_turns` pass.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: Acceptance evidence records compile, lint, OpenAPI, secret scan, diagnostics, compose-replacement smoke, full pilot flow, expected-load, and failure-injection checks.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
