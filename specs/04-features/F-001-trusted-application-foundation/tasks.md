---
id: F-001
title: Trusted Application Foundation Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-000]
supersedes: []
---


# F-001 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [x] T-010 [backend] Create FastAPI app factory, settings, request ID, and error envelope.
  - Verification: Unit/integration route tests.
- [x] T-020 [backend/data] Add Alembic baseline plus users/auth_sessions models.
  - Verification: Fresh migration test.
- [x] T-030 [backend] Implement admin seeding and Argon2id password verification.
  - Verification: Startup/rotation tests.
- [x] T-040 [backend] Implement login/me/logout and auth dependencies.
  - Verification: Cookie/authz tests.
- [x] T-050 [backend] Add health and admin proof routes.
  - Verification: Member/admin status tests.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
