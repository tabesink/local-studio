---
id: F-001
title: Trusted Application Foundation Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-000]
supersedes: []
---


# F-001 - Implementation Plan

## Build Strategy

Build only P1 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Current Pass Scope

- Add a minimal Python/FastAPI backend package with app factory, request IDs, safe error envelope, and P1 routes.
- Add SQLAlchemy/Alembic persistence for `users` and `auth_sessions`; use Postgres-compatible schema with SQLite permitted only for local automated proof.
- Seed or rotate one Administrator from environment at startup; do not add user-management UI or later-phase admin mutations.
- Add focused route, auth, password, session, and migration tests for the acceptance criteria.
- Update F-001 evidence and traceability only.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | API-only phase. User-visible behavior is credential login/session proof through HTTP clients; frontend implementation waits for P9 slice 02. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | `users` and `auth_sessions`; no plaintext passwords/tokens. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

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

## Migration And Rollback

- Schema change: yes.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
