---
id: F-001
title: Trusted Application Foundation Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-11
depends_on: [F-000]
supersedes: []
---


# F-001 - Trusted Application Foundation

Phase: P1

## Outcome

Create an empty trusted FastAPI application with Postgres migrations, users, opaque cookie sessions, roles, safe errors, request IDs, and proof routes.

## Why Now

Every later phase needs a secure application boundary, stable error envelope, role checks, and migration baseline.

## Actors

Public login users, Members, Administrators, API clients, coding agents.

## In Scope

- FastAPI app factory/composition root.
- Postgres and Alembic.
- `users` and `auth_sessions` tables.
- Seed Administrator from environment on API startup.
- Opaque random cookie token with token hash in DB only.
- Argon2id passwords.
- `require_current_user` and `require_admin` dependencies.
- Request ID middleware and canonical error envelope.
- Health, auth, and admin proof routes.

## Out Of Scope

- browser UI
- JWT
- localStorage/sessionStorage token
- user-management UI
- providers/config
- domains
- source docs
- workers
- LightRAG
- chat

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Login sets `ce_session` HttpOnly cookie and returns safe user/session expiry with no token. | API-001 |
| FR-002 | `/auth/me` resolves the current user from cookie only. | API-001 |
| FR-003 | Logout revokes server session and clears cookie. | API-001 |
| FR-004 | Admin proof route returns 403 to members and 200 to administrators. | PROD-004 |
| FR-005 | All errors use the canonical envelope with request ID when available. | API-001 |
| FR-006 | Admin user list and enable/disable routes return safe user DTOs only, are Administrator-only, and keep disabled-session behavior in the backend session guard. | API-001, DATA-001, QA-002 |

## Contracts And Data

- Contracts: API-001, DATA-001, QA-002
- Data: `users` and `auth_sessions`; no plaintext passwords/tokens.

## Acceptance Criteria

- AC-001: fresh migration works
- AC-002: seed admin exists and password rotates by env + restart
- AC-003: login JSON has no token
- AC-004: cookie is HttpOnly/SameSite
- AC-005: revoked/expired/disabled user gets safe 401
- AC-006: no token/password/hash in responses/logs/URLs
- AC-007: Administrator can disable/enable a user through the admin route; Members cannot call it; current/last Administrator disable is blocked

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
