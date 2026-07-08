---
id: F-006
title: Scoped Evidence Retrieval Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-005]
supersedes: []
---


# F-006 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `test_app_boundary_retrieval_returns_raw_hit_with_usable_ce_block`, `test_native_lightrag_app_boundary_upload_prepare_index_and_evidence`, and `test_slice_a_live_docker_controller_native_index_and_evidence`; `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py tests/test_scoped_evidence_retrieval.py -q --basetemp .pytest-tmp-p5p6-native-final-2`; `.\.venv\Scripts\python.exe -m pytest tests/test_slice_a_runtime_integration.py -q --basetemp .pytest-tmp-slice-a-live` | pass | P5 preparation/index worker submits through the private client boundary; retrieval returns backend-only raw hit text with exactly one usable `CE_BLOCK` marker per hit; the native LightRAG client now has app-boundary and live Docker-backed evidence proofs. |
| AC-002 | `test_evidence_endpoint_returns_safe_evidence_for_member_and_admin`, `test_native_lightrag_app_boundary_upload_prepare_index_and_evidence`, and `test_slice_a_live_docker_controller_native_index_and_evidence`; full suite `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` | pass | Active available Knowledge Domain with a prepared/ready Source Document returns `result: evidence_found` for both Member and Administrator, with production retrieval defaulting through `index_client_from_settings()` and passing against a Docker-started domain. |
| AC-003 | `test_evidence_endpoint_no_eligible_sources_returns_safe_409` in `tests/test_scoped_evidence_retrieval.py`; full suite `./.venv/bin/python -m pytest -q` | pass | Running domain with no query-eligible Source Documents returns `409 domain_no_eligible_sources` safe envelope. |
| AC-004 | `test_evidence_endpoint_all_hits_discarded_returns_no_grounded_context` in `tests/test_scoped_evidence_retrieval.py`; full suite `./.venv/bin/python -m pytest -q` | pass | Unknown marker hit is discarded and endpoint returns `200 { result: no_grounded_context, evidence: [] }`. |
| AC-005 | `test_mapper_discards_foreign_unknown_malformed_and_ineligible_hits` and `test_ce_block_parser_accepts_exactly_one_strict_marker` in `tests/test_scoped_evidence_retrieval.py`; focused P6 run | pass | Parser rejects missing/malformed/multiple markers; mapper discards unknown, foreign-domain, cancelling/cancelled, and deleting/ineligible Source Documents. |
| AC-006 | `test_evidence_endpoint_returns_safe_evidence_for_member_and_admin`, `test_evidence_endpoint_validation_authz_and_runtime_errors_are_safe`, and `tests/snapshots/f006_openapi.json`; full suite | pass | Evidence DTO exposes only `excerpt` and `sourceLabel`; responses exclude private source/block ids, raw scores/hits, paths, runtime details, provider payloads, and stack traces. |

## Verification Summary

- `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py tests/test_scoped_evidence_retrieval.py -q --basetemp .pytest-tmp-p5p6-native-final-2` -> 19 passed, 1 Starlette/httpx deprecation warning.
- `.\.venv\Scripts\python.exe -m pytest tests/test_slice_a_runtime_integration.py -q --basetemp .pytest-tmp-slice-a-live` -> 1 passed, 1 Starlette/httpx deprecation warning.
- `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` -> 60 passed, 1 Starlette/httpx deprecation warning.

## Completion Rule

Every criterion has automated evidence. Keep P7 chat synthesis and citation persistence out of this feature.
