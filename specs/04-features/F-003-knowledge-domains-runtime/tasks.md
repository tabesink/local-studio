---
id: F-003
title: Knowledge Domains And Private Runtime Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-002]
supersedes: []
---


# F-003 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [x] T-005 [contracts] Promote ID-A pre-P3 resolved API/data/domain-operation decisions into active specs.
  - Verification: API-001, DATA-001, and F-003 docs updated.
- [x] T-010 [backend/data] Add domain/operation migrations and generation fencing.
  - Verification: State and uniqueness tests.
- [x] T-020 [backend/api] Implement domain admin/member API routes.
  - Verification: Authz and DTO tests.
- [x] T-030 [backend/controller] Implement private controller client/server boundary.
  - Verification: Internal auth and no-public-port tests.
- [x] T-040 [backend/worker] Implement start/stop/delete worker paths.
  - Verification: Delete resume and stale generation tests.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
