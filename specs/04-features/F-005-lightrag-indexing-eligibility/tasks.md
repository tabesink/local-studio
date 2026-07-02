---
id: F-005
title: LightRAG Indexing And Query Eligibility Task List
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-004]
supersedes: []
---


# F-005 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: contract patch response lists specs read.
- [x] T-005 [docs/contracts] Patch API-001, DATA-001, AI-001, F-005 spec, plan, and test-plan with reconciled P5 design gates before business code.
  - Verification: active contracts define index fields, safe DTOs/routes, render grammar, delete rules, fixture stop gates, and eligibility ownership.
- [x] T-001 [backend/test] Build pinned LightRAG proof fixture and stop if any required behavior fails.
  - Verification: Fixture proof recorded.
- [x] T-010 [backend/data] Add index fields and migration.
  - Verification: Migration/state tests.
- [x] T-020 [backend/indexing] Implement deterministic render and hash.
  - Verification: Golden tests.
- [x] T-030 [backend/integration] Implement private LightRAG client submit/readiness/delete.
  - Verification: Idempotency/readiness/delete tests.
- [x] T-040 [backend/worker/api] Implement worker transitions and retry/cancel APIs.
  - Verification: Fence/stale tests.
- [x] T-050 [backend/service] Implement `source_is_query_eligible()` predicate.
  - Verification: Eligibility tests.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.
- [x] T-060 [backend/runtime] Promote pinned LightRAG into `vendor/lightrag/`, declare runtime deps, and wire native private runtime client/build paths per ADR-002.
  - Verification: `test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection` imports from `vendor/lightrag/`; `pyproject.toml` declares `lightrag-runtime`; P5 fixture gates re-run.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
