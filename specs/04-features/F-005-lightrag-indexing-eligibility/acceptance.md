---
id: F-005
title: LightRAG Indexing And Query Eligibility Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-004]
supersedes: []
---


# F-005 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `test_publish_queues_index_and_worker_marks_accepted_then_ready` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | P4 publish moves a prepared source to `index_state=queued` with generation/request/hash in the same publish transaction. |
| AC-002 | `test_publish_queues_index_and_worker_marks_accepted_then_ready` and `test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | App worker transitions queued -> submitting -> accepted -> ready; pinned native LightRAG proof observes `DocStatus.PROCESSED` and preserved `CE_BLOCK` marker content. |
| AC-003 | `test_index_worker_native_failure_sets_safe_index_error` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py` | pass | Native submit failure records bland `source_index_unavailable` details without raw text, runtime URL, provider payload, path, or stack trace in API DTOs. |
| AC-004 | `test_retry_and_cancel_use_generation_fences_and_safe_routes` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Retry first verifies old remote content absence, increments `index_generation`, assigns a new deterministic request id, and returns only safe source fields. |
| AC-005 | `test_retry_and_cancel_use_generation_fences_and_safe_routes` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Cancel increments generation, clears current request identity, transitions to `cancelled`, and late ready with the old generation/request writes zero readiness state. |
| AC-006 | `test_source_delete_clears_remote_index_before_local_row_removal` and `test_domain_delete_worker_clears_remote_index_before_hard_delete` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Source delete and async domain delete remove/verify private indexed content before deleting local source rows/files or domain runtime storage. |
| AC-007 | `test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection` in `tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py`; `./.venv/bin/python -m pytest` | pass | Native duplicate submit with the same doc/request returns the same track and keeps one indexed chunk; delete removes indexed chunk/status for the submitted document. |


## Additional Evidence

- T-060 vendored runtime promotion: `vendor/lightrag/_version.py` pins LightRAG `1.4.16`; `context_engine/services/lightrag_runtime.py` owns the vendored import path; `pyproject.toml` declares the focused `lightrag-runtime` optional dependencies and includes the vendored package in build discovery.
- `test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection` now imports native LightRAG from `vendor/lightrag/`, asserts the loaded package path and pinned version, and re-ran with `./.venv/bin/python -m pytest tests/test_lightrag_indexing.py -q` passing.

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
