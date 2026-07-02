---
id: F-004
title: Source Documents And Canonical Preparation Task List
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-003]
supersedes: []
---


# F-004 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [x] T-010 [backend/data] Add source/preparation/block/image migrations.
  - Verification: Fresh migration and constraints.
- [x] T-020 [backend/api/storage] Implement upload/original storage/hash duplicate guard.
  - Verification: Upload and duplicate tests.
- [x] T-030 [backend/parser] Implement Docling/Reducto adapters to `PreparedSource`.
  - Verification: Adapter shape tests.
- [x] T-040 [backend/worker] Implement validator and all-or-none publish worker.
  - Verification: Crash/cancel/stale tests.
- [x] T-050 [backend/api] Implement retry/cancel/delete/source list APIs.
  - Verification: Operation and redaction safety tests.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
