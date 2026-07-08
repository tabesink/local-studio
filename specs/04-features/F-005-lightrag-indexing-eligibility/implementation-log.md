---
id: F-005
title: LightRAG Indexing And Query Eligibility Implementation Log
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-004]
supersedes: []
---


# F-005 - Implementation Log

Status: implemented.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-06-30 | Initial spec imported from Context Engine fullstack phase plan. | Prepare agent/junior-dev build path. | Implement phase tasks in order. |
| 2026-07-02 | Patched API-001, DATA-001, AI-001, F-005 spec, plan, test plan, and tasks with reconciled P5 design gates before business code. | The post-P4 review identified missing field-level index state, safe index DTO/action shape, deterministic render grammar, remote delete fencing, pinned LightRAG proof gates, and query eligibility ownership. | Build the pinned LightRAG proof fixture next; do not add migrations or service code until T-001 passes. |
| 2026-07-02 | Implemented P5 source-owned indexing state machine, deterministic render/hash, private index client boundary, submit/readiness worker, retry/cancel APIs, source/domain delete cleanup fences, query eligibility predicate, P5 migration, and OpenAPI snapshot. | Close P5 while preserving backend ownership of LightRAG operations and safe source DTOs. Redis was not added because this app slice did not require it; future native runtime work may add it only behind an explicit contract/update. | P6 retrieval must call `source_is_query_eligible()` and map evidence by exact `CE_BLOCK` identity. |
| 2026-07-02 | Pinned native LightRAG proof runs against `.references/code/lightrag` with typed synthetic embedding/LLM functions. | The proof records `CE_BLOCK` marker preservation, duplicate-submit no duplicate chunk, processed readiness, deletion/absence, and server-side typed injection before relying on the app fake boundary for unit tests. | Keep raw rendered text and native payloads out of API, logs, and committed snapshots. |
| 2026-07-02 | Adopted ADR-002 requiring editable vendored LightRAG at `vendor/lightrag/` for native runtime integration and planned KG prompt tweaks; added follow-up task T-060. | Pip-only runtime installs cannot carry version-controlled CE prompt ownership. | Promote reference tree into `vendor/lightrag/` and repoint pinned native proof before production native runtime wiring. |
| 2026-07-02 | Closed T-060 by promoting pinned LightRAG 1.4.16 into `vendor/lightrag/`, adding a central vendored import helper, declaring focused runtime dependencies, and repointing the pinned native proof to the vendored package. | ADR-002 requires editable runtime ownership before native retrieval/runtime wiring; `.references/` remains read-only evidence. | P6 may build retrieval against the vendored native runtime boundary; future KG prompt edits must remain surgical and re-run P5 fixture gates. |
| 2026-07-06 | Pre-P7 Slice A changed production source-index wiring from the local JSON-backed client default to `LightRAGClient`, with `LocalLightRAGIndexClient` retained for explicit test injection. | LD-002 requires native vendored LightRAG indexing before F-007 chat code ships; the test fake can no longer be the production factory default. | Keep the local client for deterministic unit coverage only; target runtime deployments must install the `lightrag-runtime` optional dependencies. |
| 2026-07-06 | Added a process-global native LightRAG lifecycle guard around `LightRAGClient` operations. | `vendor/lightrag/1.4.16` uses module-level shared storage lifecycle state, so CE serializes native initialize/operation/finalize until a later concurrency proof justifies per-domain locking. | Implement per-domain native lifecycle locking only in a later phase after a passing concurrency test proves different domains can safely run native LightRAG work concurrently. |
| 2026-07-06 | Added live Docker/native Slice A proof through `test_slice_a_live_docker_controller_native_index_and_evidence`. | LD-005 requires the native indexing/evidence path to work against a started Docker-backed domain before F-007. | Remote GitHub Actions must run `.github/workflows/slice-a-runtime.yml`; local elevated proof passed. |
| 2026-07-08 | Review fixes CHG-035: index worker claim query uses `with_for_update(skip_locked=True)`; `is_absent` raises a safe `SourceIndexError` instead of swallowing exceptions; a claimed source without `index_request_id` is failed with `source_index_request_missing` instead of staying SUBMITTING. | ce-code-review #2/#20/#21 — claim race, false delete failures, and a stuck lifecycle state. | None; see `docs/residual-review-findings/a85eb030.md`. |

## Verification

| Date | Command | Result | Notes |
| --- | --- | --- | --- |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_lightrag_indexing.py tests/test_scoped_evidence_retrieval.py -q --basetemp .pytest-tmp-p5p6-native-final-2` | pass | 19 focused P5/P6 tests pass through the local-injected test boundary and the native vendored app-boundary proof; one Starlette/httpx deprecation warning from dependencies. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest tests/test_slice_a_runtime_integration.py -q --basetemp .pytest-tmp-slice-a-live` | pass | 1 live Docker/native gate passes locally with Docker daemon access. |
| 2026-07-06 | `.\.venv\Scripts\python.exe -m pytest -q --basetemp .pytest-tmp-full-final-5` | pass | 60 full-suite tests pass, including both live Docker Slice A gates; one Starlette/httpx deprecation warning from dependencies. |

## Drift Register

No unresolved code/spec drift recorded. P5 intentionally excludes retrieval/chat, member source navigation, UI source status wiring, Docker runtime orchestration, Redis, runtime URLs, and browser-visible query eligibility.
