# P1 - Trusted Application Foundation

Status: PLANNED

## Context Packet

Build the empty trusted API foundation. No browser UI, domains, documents, LightRAG, providers, chat, workers, or Docker controller yet.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p1-trusted-foundation-plan.md`.

## Previous Slice Provides

P0 provides cross-phase ownership, error/logging expectations, and the rule that Context Engine owns identity, roles, and sessions.

## This Slice Changes

- scaffold backend package and app factory;
- configure Postgres and Alembic;
- create `users` and `auth_sessions`;
- seed admin create-if-absent from env;
- implement opaque HttpOnly cookie sessions;
- implement member/admin role gates;
- implement request ID middleware and canonical error envelope;
- add minimal health/auth/admin routes.

## This Slice Must Not Rework

- no JWT;
- no localStorage token;
- no Redis or queue;
- no provider config;
- no domains, sources, LightRAG, chat, frontend, or CLI;
- no raw token in DB, logs, response, or URL.

## Next Slice Can Assume

P2 can assume authenticated admin routes exist, role checks are server-side, the canonical error registry exists, and migrations are running.

## Acceptance Criteria

- `docker compose up --build` works once Compose exists.
- migration `0001` creates users and sessions.
- admin seed creates only when absent and does not overwrite on restart.
- member login sets HttpOnly cookie and returns no token.
- member can call `/auth/me`.
- member receives `403` on admin route; admin receives `200`.
- logout revokes session and clears cookie.
- request ID appears on all responses.
- focused tests, OpenAPI snapshot, and fresh migration test pass.

