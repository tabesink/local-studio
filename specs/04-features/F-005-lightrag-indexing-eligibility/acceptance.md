---
id: F-005
title: LightRAG Indexing And Query Eligibility Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-004]
supersedes: []
---


# F-005 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `test_publish_queues_index_and_worker_marks_accepted_then_ready` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | P4 publish moves a prepared source to `index_state=queued` with generation/request/hash in the same publish transaction. |
| AC-002 | `test_publish_queues_index_and_worker_marks_accepted_then_ready`, `test_production_lightrag_client_default_is_native`, `test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection`, and `test_slice_a_live_docker_controller_native_index_and_evidence`; `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py tests/test_scoped_evidence_retrieval.py -q --basetemp .pytest-tmp-p5p6-native-final-2`; `.\.venv\Scripts\python.exe -m pytest tests/test_slice_a_runtime_integration.py -q --basetemp .pytest-tmp-slice-a-live`; `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` | pass | App worker transitions queued -> submitting -> accepted -> ready; production settings resolve to `LightRAGClient`; pinned native LightRAG proof observes `DocStatus.PROCESSED`; live Docker/native proof indexes through a started domain and preserves evidence retrieval. |
| AC-003 | `test_index_worker_native_failure_sets_safe_index_error` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py` | pass | Native submit failure records bland `source_index_unavailable` details without raw text, runtime URL, provider payload, path, or stack trace in API DTOs. |
| AC-004 | `test_retry_and_cancel_use_generation_fences_and_safe_routes` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Retry first verifies old remote content absence, increments `index_generation`, assigns a new deterministic request id, and returns only safe source fields. |
| AC-005 | `test_retry_and_cancel_use_generation_fences_and_safe_routes` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Cancel increments generation, clears current request identity, transitions to `cancelled`, and late ready with the old generation/request writes zero readiness state. |
| AC-006 | `test_source_delete_clears_remote_index_before_local_row_removal` and `test_domain_delete_worker_clears_remote_index_before_hard_delete` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Source delete and async domain delete remove/verify private indexed content before deleting local source rows/files or domain runtime storage. |
| AC-007 | `test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Native duplicate submit with the same doc/request returns the same track and keeps one indexed chunk; delete removes indexed chunk/status for the submitted document. |


## Additional Evidence

- T-060 vendored runtime promotion: `vendor/lightrag/_version.py` pins LightRAG `1.4.16`; `context_engine/services/lightrag_runtime.py` owns the vendored import path; `pyproject.toml` declares the focused `lightrag-runtime` optional dependencies and includes the vendored package in build discovery.
- `test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection` now imports native LightRAG from `vendor/lightrag/`, asserts the loaded package path and pinned version, and re-ran with `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py -q` passing.
- Pre-P7 Slice A update on 2026-07-06: `index_client_from_settings()` now defaults to `LightRAGClient`; `LocalLightRAGIndexClient` remains available only through explicit test/settings injection.
- `test_production_lightrag_client_default_is_native` and `test_native_lightrag_app_boundary_upload_prepare_index_and_evidence` prove the production factory default and an app-boundary upload/prepare/index/evidence path through the vendored runtime client.
- P8 hardening update on 2026-07-06: `test_native_lightrag_client_uses_global_lifecycle_guard` proves `LightRAGClient` serializes native `vendor/lightrag/1.4.16` lifecycle operations process-wide. A per-domain guard is deferred until a later concurrency proof.
- `test_slice_a_live_docker_controller_native_index_and_evidence` proves the native client path against a domain started by the Docker command boundary.

## Verification Summary

- `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py tests/test_scoped_evidence_retrieval.py -q --basetemp .pytest-tmp-p5p6-native-final-2` -> 19 passed, 1 Starlette/httpx deprecation warning.
- `.\.venv\Scripts\python.exe -m pytest tests/test_slice_a_runtime_integration.py -q --basetemp .pytest-tmp-slice-a-live` -> 1 passed, 1 Starlette/httpx deprecation warning.
- `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` -> 60 passed, 1 Starlette/httpx deprecation warning.

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
