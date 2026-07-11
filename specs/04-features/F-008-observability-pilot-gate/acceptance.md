---
id: F-008
title: Observability And Pilot Gate Acceptance Evidence
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-007]
supersedes: []
---


# F-008 - Acceptance Evidence

Status: implemented.

Pre-implementation contract alignment:

| Item | Evidence | Result | Notes |
| --- | --- | --- | --- |
| P8 decisions promoted to source-of-truth specs | DATA-001, API-001, EVT-001, QA-003, QA-004, RUN-001, F-008 docs, feature register | complete | Review notes remain evidence only; implementation used active contracts. |
| P8 implementation-ready lock | F-008 spec/plan/tasks/test-plan, DATA-001, API-001, QA-003, QA-004, RUN-001, traceability | complete | Locked request/operation correlation, full audit enum, JSON logs, private turn trace, no-op tracing, optional LightRAG diagnostics/log tail, and F-010 UI deferral. |
| Native LightRAG lifecycle guard | `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py::test_native_lightrag_client_uses_global_lifecycle_guard -q` -> pass; focused related run -> 3 passed | implemented | `LightRAGClient` serializes native `vendor/lightrag/1.4.16` lifecycle operations process-wide; per-domain guard remains deferred until a pinned concurrency proof. |

Core implementation evidence:

| Item | Evidence | Result | Notes |
| --- | --- | --- | --- |
| Audit schema/service | `tests/test_observability.py` -> 8 passed | implemented | Covers fresh migration, event enum/metadata safety, same-transaction audit rollback, admin audit route self-audit/default filtering, and denied admin route events. |
| Request/log correlation | `tests/test_observability.py` -> 8 passed; domain/source/index/chat regression suites passed | implemented | API request ids are server-generated, persisted on domain/source-prep operations, and reused by worker logs. Source indexing keeps `source_documents.index_request_id`. |
| Private chat traces | `tests/test_observability.py` -> 8 passed; `tests/test_grounded_streaming_chat.py` -> 9 passed | implemented | New chat turns get private `trace_id`; replay reuses the persisted value and does not expose it in API/SSE payloads. |
| JSON logging/tracing | `tests/test_observability.py` -> 8 passed | implemented | JSON log formatter, safe log allowlist, no-op tracing default, and tracing outage behavior are covered. |
| Admin audit API | `tests/test_observability.py` -> 8 passed; `tests/test_foundation_auth.py` -> 8 passed | implemented | `GET /admin/audit-events` is admin-only, bounded, audited, redacted, and represented in `tests/snapshots/f008_openapi.json`. |
| Optional LightRAG diagnostics/log tail | `tests/test_observability.py` -> 12 passed; `scripts/compose_smoke.py` -> passed | implemented | Implemented as a bounded, redacted backend-owned per-domain diagnostic file tail; missing material returns audited `diagnostics_unavailable`. |

Acceptance criteria:

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `.\.venv\Scripts\python.exe -m compileall -q context_engine tests` -> pass; `uv run --extra test ruff check context_engine tests scripts/secret_scan.py` -> pass | pass | Static type checker intentionally not configured for P8. |
| AC-002 | `.\.venv\Scripts\python.exe -m pytest tests/test_observability.py -q --basetemp tests/.pytest-tmp-observability-close` -> 12 passed; `tests/test_foundation_auth.py::test_openapi_snapshot_matches` -> passed; prior sequential regression suites passed | pass | Regression suites covered auth/OpenAPI, runtime config, domains, sources, LightRAG indexing, evidence retrieval, grounded streaming chat, and conversations. Pytest emitted only the existing Starlette/httpx deprecation warning. |
| AC-003 | `.\.venv\Scripts\python.exe scripts/secret_scan.py` -> `secret_scan: ok` | pass | Scan covers the generated public OpenAPI snapshot for forbidden secret/path/source markers. |
| AC-004 | `.\.venv\Scripts\python.exe scripts/compose_smoke.py` -> passed | pass | Approved local compose-replacement smoke proves API live/ready, DB connectivity, local runtime boundary, worker-unavailable no-partial-success behavior, worker processing, evidence retrieval, diagnostics redaction, and no browser-visible private runtime target. Deployment-specific compose remains future environment work. |
| AC-005 | `.\.venv\Scripts\python.exe -m pytest tests/test_grounded_streaming_chat.py -q --basetemp tests/.pytest-tmp-chat` -> 9 passed; conversation regression included in final touched run | pass | SSE transcript/replay behavior did not drift when request/log/trace context was added. |
| AC-006 | `.\.venv\Scripts\python.exe scripts/pilot_flow.py` -> passed | pass | Proves auth -> domain create/start -> source upload -> source prepare -> source index -> evidence retrieve -> conversation turn stream -> source delete/redaction -> domain delete. |
| AC-007 | `tests/test_observability.py::test_expected_load_smoke_for_ten_authenticated_direct_turns` included in the 8 passed P8 suite | pass | Deterministic direct-chat smoke covers 10 authenticated users without provider/runtime quota dependence. |
| AC-008 | `tests/test_grounded_streaming_chat.py::test_provider_failure_after_evidence_returns_evidence_only`; `tests/test_sources.py` invalid upload coverage; `tests/test_observability.py` DB unavailable, worker unavailable, diagnostics unavailable, and tracing outage coverage -> pass | pass | Failure surfaces return safe codes/states with no raw payloads, stack traces, runtime paths, or credentials. |

## Completion Rule

Do not reopen P8 unless a later deployment phase adds a real compose fixture, changes diagnostics ownership, or changes the pilot target. Deployment-specific compose is intentionally future environment work, not an unresolved P8 backend acceptance blocker.
