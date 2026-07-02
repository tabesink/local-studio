---
id: F-006
title: Scoped Evidence Retrieval Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-005]
supersedes: []
---


# F-006 - Tasks

## Required Order

- [ ] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [ ] T-010 [backend/service] Implement query target resolver and domain availability checks.
  - Verification: Conflict tests.
- [ ] T-020 [backend/integration] Implement private retrieval client wrapper.
  - Verification: Timeout/safe error tests.
- [ ] T-030 [backend/retrieval] Implement strict marker parser and Source Block mapper.
  - Verification: Foreign/deleted/ineligible tests.
- [ ] T-040 [backend/api] Implement `POST /api/v1/domains/{domain_id}/evidence`.
  - Verification: DTO snapshot tests.
- [ ] T-050 [backend/service] Add private callable for P7 reuse.
  - Verification: Shared mapper tests.
- [ ] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [ ] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
