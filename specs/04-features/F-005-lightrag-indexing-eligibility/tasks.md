---
id: F-005
title: LightRAG Indexing And Query Eligibility Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-004]
supersedes: []
---


# F-005 - Tasks

## Required Order

- [ ] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [ ] T-001 [backend/test] Build pinned LightRAG proof fixture and stop if any required behavior fails.
  - Verification: Fixture proof recorded.
- [ ] T-010 [backend/data] Add index fields and migration.
  - Verification: Migration/state tests.
- [ ] T-020 [backend/indexing] Implement deterministic render and hash.
  - Verification: Golden tests.
- [ ] T-030 [backend/integration] Implement private LightRAG client submit/readiness/delete.
  - Verification: Idempotency/readiness/delete tests.
- [ ] T-040 [backend/worker/api] Implement worker transitions and retry/cancel APIs.
  - Verification: Fence/stale tests.
- [ ] T-050 [backend/service] Implement `source_is_query_eligible()` predicate.
  - Verification: Eligibility tests.
- [ ] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [ ] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
