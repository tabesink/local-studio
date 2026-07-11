---
id: F-008
title: Observability And Pilot Gate Implementation Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-007]
supersedes: []
---


# F-008 - Implementation Log

Status: implemented.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-06-30 | Initial spec imported from Context Engine fullstack phase plan. | Prepare agent/junior-dev build path. | Implement phase tasks in order. |
| 2026-07-06 | Promoted P8 reconciled review decisions into DATA-001, API-001, EVT-001, QA-003, QA-004, RUN-001, F-008 docs, and feature register before backend implementation. | `.devnotes` review files are evidence, not source of truth; P8 needed authoritative schema/API/log/trace/diagnostics/pilot decisions first. | Start T-010 only after using active contracts as implementation authority. |
| 2026-07-06 | Resolved AC-001 policy as compile plus `ruff` lint with an explicit no-typechecker limitation for P8; named the live Docker controller gate and later approved `scripts/compose_smoke.py` as the local compose-replacement gate. | Avoid false pilot readiness while giving implementers executable verification commands. | Deployment-specific compose remains future environment work outside P8. |
| 2026-07-06 | Locked final pre-implementation recommendations: persist origin request ids on async operation rows, keep trace ids chat-only, implement the full audit enum, default tracing to no-op, keep LightRAG diagnostics/log capture optional, and defer Logs/Usage UI to F-010. | Prepare P8 for implementation without overbuilding an observability platform. | Core backend implemented from DATA-001/API-001/QA-003; diagnostics shipped through the bounded backend file-tail route. |
| 2026-07-06 | Implemented T-006 global native LightRAG lifecycle guard and renamed the production native adapter to `LightRAGClient`. | `vendor/lightrag/1.4.16` uses module-level shared storage lifecycle state; process-wide serialization is the safe default for pilot hardening. | Per-domain native lifecycle guard is a later-phase optimization gated by a pinned concurrency proof. |
| 2026-07-06 | Implemented P8 audit persistence/service, same-transaction audit rollback, server-generated request ids, domain/source operation request-id propagation, private chat `trace_id`, structured JSON logging, safe no-op tracing, admin audit API, and public OpenAPI snapshot. | Close the core P8 observability backend without changing P1-P7 product behavior or leaking secrets/source/prompt/runtime details. | Later closure added diagnostics, compose-replacement, pilot-flow, and failure-injection evidence. |
| 2026-07-06 | Implemented optional LightRAG diagnostics/log tail route as a bounded, redacted backend-owned per-domain diagnostic file tail. | Local runtime provisioning already owns a per-domain `logs` directory, making the optional route cheap and deterministic without piping host/global logs. | Missing diagnostic material returns audited `diagnostics_unavailable`; raw host/container logs remain out of scope. |
| 2026-07-06 | Changed request id handling to ignore caller-supplied `X-Request-ID` and always emit a server UUID. | API request ids are observability correlation ids, not a trust boundary delegated to clients. | Public clients can read the response header but cannot choose the persisted correlation value. |
| 2026-07-06 | Approved `scripts/compose_smoke.py` as the P8 local compose-replacement smoke and added `scripts/pilot_flow.py` as the full local pilot-flow gate. | The repo has no deployment compose fixture, and RUN-001 allows an approved local fake/replacement gate for P8 evidence. | Future deployment compose can be added without reopening P8 backend acceptance. |
| 2026-07-08 | Review fix CHG-035: migration 0007 downgrade now raises `RuntimeError` instead of silently dropping `audit_events` and `request_id`/`trace_id` correlation data. | ce-code-review #10 — the downgrade destroyed audit accountability with no compensation; restore-from-backup is the supported path. | Audit check-constraint swap atomicity (#23) deferred; see `docs/residual-review-findings/a85eb030.md`. |

## Verification

| Date | Command | Result | Notes |
| --- | --- | --- | --- |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py::test_native_lightrag_client_uses_global_lifecycle_guard -q` | pass | 1 focused guard test passed; one existing Starlette/httpx deprecation warning. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py::test_production_lightrag_client_default_is_native tests/test_lightrag_indexing.py::test_native_lightrag_client_uses_global_lifecycle_guard tests/test_scoped_evidence_retrieval.py::test_native_lightrag_app_boundary_upload_prepare_index_and_evidence -q` | pass | 3 focused related tests passed; one existing Starlette/httpx deprecation warning. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m compileall context_engine tests` | pass | Compile check passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m compileall -q context_engine tests` | pass | Final quiet compile check passed. |
| 2026-07-06 | `uv run --extra test ruff check context_engine tests scripts/secret_scan.py` | pass | Ruff was installed through the declared test extra; only unused-import cleanup was required. |
| 2026-07-06 | `.\.venv\Scripts\python.exe scripts/secret_scan.py` | pass | `secret_scan: ok`. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_observability.py -q --basetemp tests/.pytest-tmp-observability-final` | pass | 8 P8 tests passed; one existing Starlette/httpx deprecation warning. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_foundation_auth.py -q --basetemp tests/.pytest-tmp-foundation` | pass | 8 tests passed; includes F-008 OpenAPI snapshot evidence. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_runtime_config.py -q --basetemp tests/.pytest-tmp-runtime-config` | pass | 9 tests passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_domains.py -q --basetemp tests/.pytest-tmp-domains` | pass | 9 tests passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_sources.py -q --basetemp tests/.pytest-tmp-sources` | pass | 11 tests passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py -q --basetemp tests/.pytest-tmp-lightrag` | pass | 12 tests passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_scoped_evidence_retrieval.py -q --basetemp tests/.pytest-tmp-evidence` | pass | 8 tests passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_grounded_streaming_chat.py -q --basetemp tests/.pytest-tmp-chat` | pass | 9 tests passed; SSE/replay behavior did not drift. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_conversations.py -q --basetemp tests/.pytest-tmp-conversations` | pass | 7 tests passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_conversations.py tests/test_domains.py tests/test_lightrag_indexing.py tests/test_runtime_config.py -q --basetemp tests/.pytest-tmp-touched-final` | pass | 37 touched regression tests passed after lint cleanup. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_observability.py -q --basetemp tests/.pytest-tmp-observability-close` | pass | 12 P8 tests passed, including diagnostics safe tail/unavailable, DB unavailable readiness, worker-unavailable no-partial-success, and expected-load smoke. One existing Starlette/httpx deprecation warning. |
| 2026-07-06 | `.\.venv\Scripts\python.exe scripts/compose_smoke.py` | pass | Local compose-replacement smoke passed: API live/ready, DB connectivity, local runtime, queued worker-unavailable state, worker processing, evidence retrieval, diagnostics redaction, and no private runtime target in public payloads. |
| 2026-07-06 | `.\.venv\Scripts\python.exe scripts/pilot_flow.py` | pass | Full local pilot flow passed: auth, domain create/start, upload, prepare, index, evidence, chat, source delete/redaction, and domain delete. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_foundation_auth.py::test_openapi_snapshot_matches -q --basetemp tests/.pytest-tmp-openapi-close` | pass | F-008 OpenAPI snapshot includes the diagnostics route. One existing Starlette/httpx deprecation warning. |
| 2026-07-06 | `uv run --extra test ruff check context_engine tests scripts` | pass | Full code/test/script lint passed. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m compileall -q context_engine tests scripts` | pass | Compile check passed after diagnostics and gate scripts. |

## Drift Register

No code/spec drift recorded for P8. The root deployment compose fixture remains absent by design; P8 closes AC-004 through the approved local compose-replacement smoke in RUN-001. Per-domain native LightRAG lifecycle locking remains intentionally deferred until a later concurrency proof against `vendor/lightrag/1.4.16`.
