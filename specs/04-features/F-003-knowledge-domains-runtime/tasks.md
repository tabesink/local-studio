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

- [ ] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [ ] T-010 [backend/data] Add domain/operation migrations and generation fencing.
  - Verification: State and uniqueness tests.
- [ ] T-020 [backend/api] Implement domain admin/member API routes.
  - Verification: Authz and DTO tests.
- [ ] T-030 [backend/controller] Implement private controller client/server boundary.
  - Verification: Internal auth and no-public-port tests.
- [ ] T-040 [backend/worker] Implement start/stop/delete worker paths.
  - Verification: Delete resume and stale generation tests.
- [ ] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [ ] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
